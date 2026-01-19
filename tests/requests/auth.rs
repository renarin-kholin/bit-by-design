use bit_by_design::{app::App, models::users};
use insta::{assert_debug_snapshot, with_settings};
use loco_rs::testing::prelude::*;
use serial_test::serial;

use super::prepare_data;

// TODO: see how to dedup / extract this to app-local test utils
// not to framework, because that would require a runtime dep on insta
macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("auth_request");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn can_register() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        let email = "test@loco.com";
        let payload = serde_json::json!({
            "name": "loco",
            "email": email,
            "password": "12341234"
        });

        let response = request.post("/api/auth/register").json(&payload).await;
        assert_eq!(
            response.status_code(),
            200,
            "Register request should succeed"
        );
        let saved_user = users::Model::find_by_email(&ctx.db, email).await;

        with_settings!({
            filters => cleanup_user_model()
        }, {
            assert_debug_snapshot!(saved_user);
        });

        let deliveries = ctx.mailer.unwrap().deliveries();
        assert_eq!(deliveries.count, 1, "Exactly one email should be sent");

        // with_settings!({
        //     filters => cleanup_email()
        // }, {
        //     assert_debug_snapshot!(ctx.mailer.unwrap().deliveries());
        // });
    })
    .await;
}

#[tokio::test]
#[serial]
async fn login_with_un_existing_email() {
    configure_insta!();

    request::<App, _, _>(|request, _ctx| async move {
        let login_response = request
            .post("/api/auth/login")
            .json(&serde_json::json!({
                "email": "un_existing@loco.rs",
            }))
            .await;

        assert_eq!(login_response.status_code(), 401, "Login request should return 401");
        login_response.assert_json(&serde_json::json!({"error": "unauthorized", "description": "You do not have permission to access this resource"}));
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_get_current_user() {
    configure_insta!();

    request::<App, _, _>(|request, ctx| async move {
        let user = prepare_data::init_user_login(&request, &ctx).await;

        let (auth_key, auth_value) = prepare_data::auth_header(&user.token);
        let response = request
            .get("/api/auth/current")
            .add_header(auth_key, auth_value)
            .await;

        assert_eq!(
            response.status_code(),
            200,
            "Current request should succeed"
        );

        with_settings!({
            filters => cleanup_user_model()
        }, {
            assert_debug_snapshot!((response.status_code(), response.text()));
        });
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_reject_invalid_email() {
    configure_insta!();
    request::<App, _, _>(|request, _ctx| async move {
        let invalid_email = "user1@temp-mail.com";
        let payload = serde_json::json!({
            "email": invalid_email,
        });
        let response = request.post("/api/auth/magic-link").json(&payload).await;
        assert_eq!(
            response.status_code(),
            400,
            "Expected request with invalid email '{invalid_email}' to be blocked, but it was allowed."
        );
    })
    .await;
}
