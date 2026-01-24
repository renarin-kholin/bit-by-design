use bit_by_design::{app::App, models::_entities::scores};
use loco_rs::prelude::*;
use serial_test::serial;

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_get_scores_when_leaderboard_enabled() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create submission and score, enable leaderboard
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let submission = prepare_data::create_submission_for_user(&ctx, user.user.id).await;

        // Create a score directly
        let score = scores::ActiveModel {
            submission_id: Set(submission.id),
            problem_fit_score: Set(4),
            visual_clarity_score: Set(5),
            style_interpretation_score: Set(3),
            originality_score: Set(4),
            overall_quality_score: Set(4),
            final_score: Set(800),
            ..Default::default()
        };
        score.insert(&ctx.db).await.unwrap();

        prepare_data::enable_leaderboard(&ctx).await;

        // Get scores
        let res = request.get("/api/scores").await;

        assert_eq!(
            res.status_code(),
            200,
            "Should get scores when leaderboard enabled"
        );
        let body: Vec<serde_json::Value> = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body.len(), 1, "Should have one score");
        assert_eq!(body[0]["final_score"], 800);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn returns_404_when_leaderboard_disabled() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create submission and score, keep leaderboard disabled
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let submission = prepare_data::create_submission_for_user(&ctx, user.user.id).await;

        // Create a score directly
        let score = scores::ActiveModel {
            submission_id: Set(submission.id),
            problem_fit_score: Set(4),
            visual_clarity_score: Set(5),
            style_interpretation_score: Set(3),
            originality_score: Set(4),
            overall_quality_score: Set(4),
            final_score: Set(800),
            ..Default::default()
        };
        score.insert(&ctx.db).await.unwrap();

        // Ensure config exists but leaderboard is disabled (default)
        prepare_data::ensure_config(&ctx).await;

        // Get scores
        let res = request.get("/api/scores").await;

        assert_eq!(
            res.status_code(),
            404,
            "Should return 404 when leaderboard disabled"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn returns_404_when_no_config() {
    request::<App, _, _>(|request, _ctx| async move {
        // Don't create config

        // Get scores
        let res = request.get("/api/scores").await;

        assert_eq!(res.status_code(), 404, "Should return 404 when no config");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn returns_empty_array_when_no_scores() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Enable leaderboard but no scores
        prepare_data::enable_leaderboard(&ctx).await;

        // Get scores
        let res = request.get("/api/scores").await;

        assert_eq!(res.status_code(), 200, "Should return 200");
        let body: Vec<serde_json::Value> = serde_json::from_str(&res.text()).unwrap();
        assert!(body.is_empty(), "Should return empty array");
    })
    .await;
}
