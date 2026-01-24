use bit_by_design::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_create_submission_during_submission_period() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user and set submission period active
        let user = prepare_data::init_user_login(&request, &ctx).await;
        prepare_data::set_submission_period_active(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Create submission
        let params = prepare_data::create_submission_params().await;
        let res = request
            .post("/api/submissions")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(
            res.status_code(),
            200,
            "Should create submission successfully"
        );

        // Verify response contains the submission data
        let body: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body["figma_link"], "https://figma.com/file/test");
        assert_eq!(body["user_id"], user.user.id);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn cannot_create_submission_outside_submission_period() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user and set submission period closed
        let user = prepare_data::init_user_login(&request, &ctx).await;
        prepare_data::set_submission_period_closed(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Try to create submission
        let params = prepare_data::create_submission_params().await;
        let res = request
            .post("/api/submissions")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(
            res.status_code(),
            400,
            "Should reject submission outside period"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn cannot_create_duplicate_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user with existing submission
        let user = prepare_data::init_user_login(&request, &ctx).await;
        prepare_data::set_submission_period_active(&ctx).await;
        prepare_data::create_submission_for_user(&ctx, user.user.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Try to create another submission
        let params = prepare_data::create_submission_params().await;
        let res = request
            .post("/api/submissions")
            .add_header(auth_key.clone(), auth_value.clone())
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 400, "Should reject duplicate submission");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_get_own_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user with submission
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let submission = prepare_data::create_submission_for_user(&ctx, user.user.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Get own submission
        let res = request
            .get("/api/submissions/mine")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 200, "Should get own submission");
        let body: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body["id"], submission.id);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn get_mine_returns_404_when_no_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user without submission
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Get own submission
        let res = request
            .get("/api/submissions/mine")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(
            res.status_code(),
            404,
            "Should return 404 when no submission"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_update_own_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create user with submission
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let submission = prepare_data::create_submission_for_user(&ctx, user.user.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Update submission
        let updated_params = serde_json::json!({
            "figma_link": "https://figma.com/file/updated",
            "design_image": "https://example.com/updated.png",
            "target_user_and_goal": "Updated target",
            "layout_explanation": "Updated layout",
            "style_interpretation": "Updated style",
            "key_trade_off": "Updated trade-off",
            "originality_confirmed": true,
            "template_compliance_confirmed": true,
            "future_improvements": "Updated improvements"
        });

        let res = request
            .put(&format!("/api/submissions/{}", submission.id))
            .add_header(auth_key, auth_value)
            .json(&updated_params)
            .await;

        assert_eq!(res.status_code(), 200, "Should update submission");
        let body: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        assert_eq!(body["figma_link"], "https://figma.com/file/updated");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn cannot_update_others_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create two users, one with a submission
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // User 2 tries to update User 1's submission
        let updated_params = prepare_data::create_submission_params().await;
        let res = request
            .put(&format!("/api/submissions/{}", submission.id))
            .add_header(auth_key, auth_value)
            .json(&updated_params)
            .await;

        assert_eq!(res.status_code(), 401, "Should reject unauthorized update");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_get_assigned_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create two users, one with submission, assign to other
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        prepare_data::create_vote_assignment(&ctx, user2.user.id, submission.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // User 2 gets assigned submission
        let res = request
            .get(&format!("/api/submissions/{}", submission.id))
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 200, "Should get assigned submission");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn cannot_get_unassigned_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create two users, one with submission (no assignment)
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let user2 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user2@test.com", "User 2")
                .await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user2.token);

        // User 2 tries to get User 1's submission without assignment
        let res = request
            .get(&format!("/api/submissions/{}", submission.id))
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 401, "Should reject unauthorized access");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn admin_can_get_any_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create regular user with submission and admin user
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let admin =
            prepare_data::init_user_login_with_email(&request, &ctx, "admin@test.com", "Admin")
                .await;
        prepare_data::make_admin(&ctx, admin.user.id).await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&admin.token);

        // Admin gets any submission
        let res = request
            .get(&format!("/api/submissions/{}", submission.id))
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(res.status_code(), 200, "Admin should access any submission");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn admin_can_update_any_submission() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create regular user with submission and admin user
        let user1 =
            prepare_data::init_user_login_with_email(&request, &ctx, "user1@test.com", "User 1")
                .await;
        let admin =
            prepare_data::init_user_login_with_email(&request, &ctx, "admin@test.com", "Admin")
                .await;
        prepare_data::make_admin(&ctx, admin.user.id).await;
        let submission = prepare_data::create_submission_for_user(&ctx, user1.user.id).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&admin.token);

        // Admin updates any submission
        let updated_params = serde_json::json!({
            "figma_link": "https://figma.com/file/admin-updated",
            "design_image": "https://example.com/admin.png",
            "target_user_and_goal": "Admin updated",
            "layout_explanation": "Admin layout",
            "style_interpretation": "Admin style",
            "key_trade_off": "Admin trade-off",
            "originality_confirmed": true,
            "template_compliance_confirmed": true,
            "future_improvements": null
        });

        let res = request
            .put(&format!("/api/submissions/{}", submission.id))
            .add_header(auth_key, auth_value)
            .json(&updated_params)
            .await;

        assert_eq!(res.status_code(), 200, "Admin should update any submission");
    })
    .await;
}
