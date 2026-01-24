use bit_by_design::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_get_config() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Ensure config exists
        prepare_data::ensure_config(&ctx).await;

        // Get config (no auth required)
        let res = request.get("/api/config").await;

        assert_eq!(res.status_code(), 200, "Should get config");
        let body: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        assert!(
            body.get("show_leaderboard").is_some(),
            "Should have show_leaderboard field"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn returns_404_when_no_config() {
    request::<App, _, _>(|request, _ctx| async move {
        // Don't create config

        // Get config
        let res = request.get("/api/config").await;

        assert_eq!(res.status_code(), 404, "Should return 404 when no config");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn admin_can_update_config() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create admin user and config
        let admin = prepare_data::init_user_login(&request, &ctx).await;
        prepare_data::make_admin(&ctx, admin.user.id).await;
        prepare_data::ensure_config(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&admin.token);

        // Update config
        let params = serde_json::json!({
            "submission_start": "2025-01-01T00:00:00+00:00",
            "submission_end": "2025-01-15T00:00:00+00:00",
            "voting_start": "2025-01-16T00:00:00+00:00",
            "voting_end": "2025-01-30T00:00:00+00:00"
        });
        let res = request
            .put("/api/config")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 200, "Admin should update config");
        let body: serde_json::Value = serde_json::from_str(&res.text()).unwrap();
        // Check that the date was stored (format may be Z or +00:00)
        let submission_start = body["submission_start"].as_str().unwrap();
        assert!(
            submission_start.starts_with("2025-01-01T00:00:00"),
            "submission_start should be set correctly"
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn non_admin_cannot_update_config() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create regular user and config
        let user = prepare_data::init_user_login(&request, &ctx).await;
        prepare_data::ensure_config(&ctx).await;
        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);

        // Try to update config
        let params = serde_json::json!({
            "submission_start": "2025-01-01T00:00:00+00:00",
            "submission_end": "2025-01-15T00:00:00+00:00",
            "voting_start": null,
            "voting_end": null
        });
        let res = request
            .put("/api/config")
            .add_header(auth_key, auth_value)
            .json(&params)
            .await;

        assert_eq!(res.status_code(), 401, "Non-admin should not update config");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn requires_auth_to_update_config() {
    request::<App, _, _>(|request, ctx| async move {
        // Setup: Create config
        prepare_data::ensure_config(&ctx).await;

        // Try to update config without auth
        let params = serde_json::json!({
            "submission_start": null,
            "submission_end": null,
            "voting_start": null,
            "voting_end": null
        });
        let res = request.put("/api/config").json(&params).await;

        assert_eq!(
            res.status_code(),
            401,
            "Should require auth to update config"
        );
    })
    .await;
}
