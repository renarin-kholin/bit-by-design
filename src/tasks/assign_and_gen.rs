use crate::models::_entities::configs;
use crate::tasks::{assign_submissions::AssignSubmissions, gen_leaderboard::GenLeaderboard};
use chrono::Utc;
use loco_rs::prelude::*;

pub struct AssignAndGen;
#[async_trait]
impl Task for AssignAndGen {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "assign_and_gen".to_string(),
            detail: "Ran by the scheduler (runs every 1 min), Automatically runs assign_submissions and gen_leaderboard based on the current state. And also only runs them once.".to_string(),
        }
    }
    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        // Fetch config
        let config = configs::Entity::find().one(&ctx.db).await?;
        let now = Utc::now();
        if let Some(config) = config {
            // Only run assign_submissions if submission period has ended and we haven't assigned yet
            if let Some(sub_end) = config.submission_end {
                if now > sub_end {
                    if config.assigned {
                        return Ok(());
                    }
                    // Use a marker: if voting_start is Some and voting_end is None, we are in voting period and can assign
                    // Or, if vote assignments table is empty, we can assign
                    // For simplicity, just always try to assign once after submission ends
                    println!("[assign_and_gen] Running assign_submissions...");
                    let assign_task = AssignSubmissions;
                    let _ = assign_task.run(ctx, _vars).await;
                    let mut config = config.clone().into_active_model();
                    config.assigned = Set(true);
                }
            }
            // Only run gen_leaderboard if voting period has ended and we haven't generated yet
            if let Some(vote_end) = config.voting_end {
                if now > vote_end {
                    if config.created_scores {
                        return Ok(());
                    }
                    // For simplicity, just always try to generate leaderboard once after voting ends
                    println!("[assign_and_gen] Running gen_leaderboard...");
                    let gen_task = GenLeaderboard;
                    let _ = gen_task.run(ctx, _vars).await;
                    let mut config = config.into_active_model();
                    config.created_scores = Set(true);
                }
            }
        } else {
            println!("[assign_and_gen] No config found, skipping.");
        }
        Ok(())
    }
}
