use loco_rs::prelude::*;

use crate::models::{_entities::votes, scores, submissions};

#[derive(Default)]
struct CriterionScores<T> {
    problem_fit: T,
    clarity: T,
    style_interpretation: T,
    originality: T,
    overall_quality: T,
}

/// Calculate median of a slice. Returns None if empty.
fn median(values: &mut [i32]) -> Option<f32> {
    if values.is_empty() {
        return None;
    }
    values.sort();
    let n = values.len();
    if n % 2 == 1 {
        Some(values[n / 2] as f32)
    } else {
        Some((values[n / 2 - 1] + values[n / 2]) as f32 / 2.0)
    }
}

/// Convert a 1-5 score to 0-1000 scale (1→200, 5→1000)
fn scale_to_1000(score: f32) -> i32 {
    (score * 200.0) as i32
}

/// Scale final score with higher precision to avoid collisions (1→2000, 5→10000)
fn scale_final(score: f32) -> i32 {
    (score * 2000.0) as i32
}

// Weights for each criterion (must sum to 1.0)
const WEIGHT_PROBLEM_FIT: f32 = 0.25;
const WEIGHT_CLARITY: f32 = 0.20;
const WEIGHT_STYLE: f32 = 0.20;
const WEIGHT_ORIGINALITY: f32 = 0.15;
const WEIGHT_OVERALL: f32 = 0.20;

pub struct GenLeaderboard;
#[async_trait]
impl Task for GenLeaderboard {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "gen_leaderboard".to_string(),
            detail: "Task generator".to_string(),
        }
    }
    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        // clear scores if they exist already
        scores::Entity::delete_many().exec(&ctx.db).await?;

        let all_votes = votes::Entity::find().all(&ctx.db).await?;

        // Calculate global means for Bayesian smoothing
        let mut global_problem_fit = Vec::new();
        let mut global_clarity = Vec::new();
        let mut global_style = Vec::new();
        let mut global_originality = Vec::new();
        let mut global_overall = Vec::new();

        for vote in &all_votes {
            global_problem_fit.push(vote.problem_fit_score);
            global_clarity.push(vote.clarity_score);
            global_style.push(vote.style_interpretation_score);
            global_originality.push(vote.originality_score);
            global_overall.push(vote.overall_quality_score);
        }

        let global_means = CriterionScores::<f32> {
            problem_fit: mean(&global_problem_fit).unwrap_or(0.0),
            clarity: mean(&global_clarity).unwrap_or(0.0),
            style_interpretation: mean(&global_style).unwrap_or(0.0),
            originality: mean(&global_originality).unwrap_or(0.0),
            overall_quality: mean(&global_overall).unwrap_or(0.0),
        };

        let all_submissions = submissions::Entity::find().all(&ctx.db).await?;
        for submission in all_submissions {
            let submission_votes: Vec<&votes::Model> = all_votes
                .iter()
                .filter(|v| v.submission_id == submission.id)
                .collect();

            // Skip submissions with no votes
            if submission_votes.is_empty() {
                println!("Skipping submission {} - no votes received", submission.id);
                continue;
            }

            let mut aggregate_scores: CriterionScores<Vec<i32>> = Default::default();
            for vote in &submission_votes {
                aggregate_scores.problem_fit.push(vote.problem_fit_score);
                aggregate_scores.clarity.push(vote.clarity_score);
                aggregate_scores
                    .style_interpretation
                    .push(vote.style_interpretation_score);
                aggregate_scores.originality.push(vote.originality_score);
                aggregate_scores
                    .overall_quality
                    .push(vote.overall_quality_score);
            }

            // Calculate raw median scores (1-5 scale)
            let raw_medians = CriterionScores::<f32> {
                problem_fit: median(&mut aggregate_scores.problem_fit).unwrap_or(0.0),
                clarity: median(&mut aggregate_scores.clarity).unwrap_or(0.0),
                style_interpretation: median(&mut aggregate_scores.style_interpretation)
                    .unwrap_or(0.0),
                originality: median(&mut aggregate_scores.originality).unwrap_or(0.0),
                overall_quality: median(&mut aggregate_scores.overall_quality).unwrap_or(0.0),
            };

            // Apply Bayesian smoothing
            // Score = (v / (v + m)) * R + (m / (v + m)) * C
            // v = number of votes
            // m = smoothing factor (dummy votes)
            // R = local median
            // C = global mean
            let v = submission_votes.len() as f32;
            const M: f32 = 2.0; // Smoothing factor

            let bayesian_score = |local_median: f32, global_mean: f32| -> f32 {
                (v / (v + M)) * local_median + (M / (v + M)) * global_mean
            };

            let smoothed_scores = CriterionScores::<f32> {
                problem_fit: bayesian_score(raw_medians.problem_fit, global_means.problem_fit),
                clarity: bayesian_score(raw_medians.clarity, global_means.clarity),
                style_interpretation: bayesian_score(
                    raw_medians.style_interpretation,
                    global_means.style_interpretation,
                ),
                originality: bayesian_score(raw_medians.originality, global_means.originality),
                overall_quality: bayesian_score(
                    raw_medians.overall_quality,
                    global_means.overall_quality,
                ),
            };

            // Calculate weighted average (still 1-5 scale) using SMOOTHED scores
            let weighted_average = smoothed_scores.problem_fit * WEIGHT_PROBLEM_FIT
                + smoothed_scores.clarity * WEIGHT_CLARITY
                + smoothed_scores.style_interpretation * WEIGHT_STYLE
                + smoothed_scores.originality * WEIGHT_ORIGINALITY
                + smoothed_scores.overall_quality * WEIGHT_OVERALL;

            // Store scores scaled to 0-1000 (so 5/5 = 1000, 1/5 = 200)
            // Final score uses higher precision (0-10000) to reduce ranking collisions
            let score = scores::ActiveModel {
                submission_id: Set(submission.id),
                problem_fit_score: Set(scale_to_1000(smoothed_scores.problem_fit)),
                visual_clarity_score: Set(scale_to_1000(smoothed_scores.clarity)),
                style_interpretation_score: Set(scale_to_1000(
                    smoothed_scores.style_interpretation,
                )),
                originality_score: Set(scale_to_1000(smoothed_scores.originality)),
                overall_quality_score: Set(scale_to_1000(smoothed_scores.overall_quality)),
                final_score: Set(scale_final(weighted_average)),
                ..Default::default()
            };
            score.insert(&ctx.db).await?;
        }
        println!("Generated Leaderboard successfully.");
        Ok(())
    }
}

/// Calculate mean of a slice. Returns None if empty.
fn mean(values: &[i32]) -> Option<f32> {
    if values.is_empty() {
        return None;
    }
    let sum: i32 = values.iter().sum();
    Some(sum as f32 / values.len() as f32)
}
