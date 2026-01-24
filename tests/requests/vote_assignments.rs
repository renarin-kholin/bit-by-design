use bit_by_design::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_get_own_assignments() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create users and submissions
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // Get own assignments
        let res = request
            .get("/api/vote_assignments/mine")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 200, "Should get own assignments");
        let body: Vec<serde_json::Value> = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body.len(), 1, "Should have one assignment");
        assert_eq!(body[0]["submission_id"], submission.id);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn mine_returns_empty_when_no_assignments() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user without assignments
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Get own assignments
        let res = request
            .get("/api/vote_assignments/mine")
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
async fn can_get_multiple_assignments() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create multiple submissions and assignments
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let user3 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user3@test.com", "User 3")
                .await;

        let submission1 = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        let submission2 = prepare_data::create_submission_for_user(&ctx, user2.user.id).await;

        prepare_data::create_vote_assignment(&ctx, user3.user.id, submission1.id).await;
        prepare_data::create_vote_assignment(&ctx, user3.user.id, submission2.id).await;

        let (auth_key, auth_value) = prepare_data::auth_header(&user3.token);

        // Get own assignments
        let res = request
            .get("/api/vote_assignments/mine")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 200, "Should get own assignments");
        let body: Vec<serde_json::Value> = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body.len(), 2, "Should have two assignments");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn requires_authentication() {
    request::<App, _, _>(|request, _ctx| async move {
        // Try to get assignments without auth
        let res = request.get("/api/vote_assignments/mine").await;

        assert_eq!(res.status_code(), 401, "Should require authentication");
    })
    .await;
}
