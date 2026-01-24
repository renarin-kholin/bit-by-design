use bit_by_design::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_create_vote_during_voting_period() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create users, submissions, assignment, and set voting period active
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        prepare_data::set_voting_period_active(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Create vote
        let params = prepare_data::create_vote_params(submission.id);
        let res = request
            .post("/api/votes")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 200, "Should create vote successfully");

        let body: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body["submission_id"], submission.id);
        assert_eq!(body["problem_fit_score"], 4);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn cannot_create_vote_outside_voting_period() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create users, submissions, and set voting period closed
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        prepare_data::set_voting_period_closed(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Try to create vote
        let params = prepare_data::create_vote_params(submission.id);
        let res = request
            .post("/api/votes")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 400, "Should reject vote outside period");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn cannot_vote_twice_on_same_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create users, submissions, existing vote
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        prepare_data::create_vote(&ctx, user2.user.id, submission.id).await;
        prepare_data::set_voting_period_active(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Try to vote again
        let params = prepare_data::create_vote_params(submission.id);
        let res = request
            .post("/api/votes")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 400, "Should reject duplicate vote");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_invalid_score_too_high() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        prepare_data::set_voting_period_active(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Create vote with score > 5
        let params = serde_json::json!({
            "submission_id": submission.id,
            "problem_fit_score": 6,  // Invalid - too high
            "clarity_score": 5,
            "style_interpretation_score": 3,
            "originality_score": 4,
            "overall_quality_score": 4
        });
        let res = request
            .post("/api/votes")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 400, "Should reject score > 5");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn rejects_invalid_score_negative() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        prepare_data::set_voting_period_active(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Create vote with negative score
        let params = serde_json::json!({
            "submission_id": submission.id,
            "problem_fit_score": -1,  // Invalid - negative
            "clarity_score": 5,
            "style_interpretation_score": 3,
            "originality_score": 4,
            "overall_quality_score": 4
        });
        let res = request
            .post("/api/votes")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 400, "Should reject negative score");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn accepts_boundary_scores() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        prepare_data::set_voting_period_active(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Create vote with boundary scores (0 and 5)
        let params = serde_json::json!({
            "submission_id": submission.id,
            "problem_fit_score": 0,  // Valid minimum
            "clarity_score": 5,      // Valid maximum
            "style_interpretation_score": 0,
            "originality_score": 5,
            "overall_quality_score": 3
        });
        let res = request
            .post("/api/votes")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(
            res.status_code(),
            200,
            "Should accept boundary scores 0 and 5"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_get_own_votes() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create users, submissions, votes
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote(&ctx, user2.user.id, submission.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Get own votes
        let res = request
            .get("/api/votes/mine")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 200, "Should get own votes");
        let body: Vec<serde_json::Value> = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body.len(), 1, "Should have one vote");
        assert_eq!(body[0]["submission_id"], submission.id);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn mine_returns_empty_when_no_votes() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user without votes
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Get own votes
        let res = request
            .get("/api/votes/mine")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 200, "Should return 200");
        let body: Vec<serde_json::Value> = serde_json::from_str(&res.text()).unwrap();
        assert!(body.is_empty(), "Should return empty array");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn requires_authentication_for_voting() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create submission without authentication
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let submission = prepare_data::create_submission_for_user(&ctx, user.user.id).await;
        prepare_data::set_voting_period_active(&ctx).await;

        // Try to vote without auth
        let params = prepare_data::create_vote_params(submission.id);
        let res = request.post("/api/votes").json(&params).await;

        assert_eq!(res.status_code(), 401, "Should require authentication");
    })
    .await;
}
