use axum::http::{HeaderName, HeaderValue};
use bit_by_design::{
    models::{
        _entities::{admins, configs, submissions, vote_assignments, votes},
        users,
    },
    views::auth::LoginResponse,
};
use chrono::{Local, TimeDelta};
use loco_rs::{app::AppContext, prelude::*, TestServer};
use sea_orm::prelude::DateTimeWithTimeZone;

const USER_EMAIL: &str = "test@loco.com";

pub struct LoggedInUser {
    pub user: users::Model,
    pub token: String,
}

/// Creates a user with the given email and logs them in
pub async fn init_user_login_with_email(
    request: &TestServer,
    ctx: &AppContext,
    email: &str,
    name: &str,
) -> LoggedInUser {
    // First, create the user directly in the database
    let user = users::ActiveModel {
        email: Set(email.to_string()),
        name: Set(name.to_string()),
        ..Default::default()
    };
    let user = user.insert(&ctx.db).await.unwrap();

    // Generate OTP for the user
    let user = user.into_active_model().create_otp(&ctx.db).await.unwrap();

    let login_payload = serde_json::json!({
        "email": user.email,
        "otp": user.otp,
    });

    let response = request.post("/api/auth/login").json(&login_payload).await;
    let login_response: LoginResponse = serde_json::from_str(&response.text()).unwrap();

    LoggedInUser {
        user: users::Model::find_by_email(&ctx.db, email).await.unwrap(),
        token: login_response.token,
    }
}

pub async fn init_user_login(request: &TestServer, ctx: &AppContext) -> LoggedInUser {
    init_user_login_with_email(request, ctx, USER_EMAIL, "loco").await
}

pub fn auth_header(token: &str) -> (HeaderName, HeaderValue) {
    let auth_header_value = HeaderValue::from_str(&format!("Bearer {}", &token)).unwrap();

    (HeaderName::from_static("authorization"), auth_header_value)
}

/// Creates multiple test users and returns them as logged in
#[allow(dead_code)]
pub async fn create_test_users(
    request: &TestServer,
    ctx: &AppContext,
    count: usize,
) -> Vec<LoggedInUser> {
    let mut users = Vec::new();
    for i in 0..count {
        let email = format!("user{}@test.com", i);
        let name = format!("User {}", i);
        let user = init_user_login_with_email(request, ctx, &email, &name).await;
        users.push(user);
    }
    users
}

/// Makes a user an admin
pub async fn make_admin(ctx: &AppContext, user_id: i32) {
    let admin = admins::ActiveModel {
        user_id: Set(user_id),
        ..Default::default()
    };
    admin.insert(&ctx.db).await.unwrap();
}

/// Creates a config entry if it doesn't exist
pub async fn ensure_config(ctx: &AppContext) -> configs::Model {
    let config = configs::Entity::find().one(&ctx.db).await.unwrap();
    if let Some(config) = config {
        config
    } else {
        let config = configs::ActiveModel {
            show_leaderboard: Set(false),
            ..Default::default()
        };
        config.insert(&ctx.db).await.unwrap()
    }
}

/// Sets the submission period to encompass "now"
pub async fn set_submission_period_active(ctx: &AppContext) {
    let config = ensure_config(ctx).await;
    let mut config = config.into_active_model();
    let now = DateTimeWithTimeZone::from(Local::now());
    config.submission_start = Set(Some(now - TimeDelta::hours(1)));
    config.submission_end = Set(Some(now + TimeDelta::hours(1)));
    config.save(&ctx.db).await.unwrap();
}

/// Sets the voting period to encompass "now"
pub async fn set_voting_period_active(ctx: &AppContext) {
    let config = ensure_config(ctx).await;
    let mut config = config.into_active_model();
    let now = DateTimeWithTimeZone::from(Local::now());
    config.voting_start = Set(Some(now - TimeDelta::hours(1)));
    config.voting_end = Set(Some(now + TimeDelta::hours(1)));
    config.save(&ctx.db).await.unwrap();
}

/// Sets the submission period to the past (closed)
pub async fn set_submission_period_closed(ctx: &AppContext) {
    let config = ensure_config(ctx).await;
    let mut config = config.into_active_model();
    let now = DateTimeWithTimeZone::from(Local::now());
    config.submission_start = Set(Some(now - TimeDelta::hours(2)));
    config.submission_end = Set(Some(now - TimeDelta::hours(1)));
    config.save(&ctx.db).await.unwrap();
}

/// Sets the voting period to the past (closed)
pub async fn set_voting_period_closed(ctx: &AppContext) {
    let config = ensure_config(ctx).await;
    let mut config = config.into_active_model();
    let now = DateTimeWithTimeZone::from(Local::now());
    config.voting_start = Set(Some(now - TimeDelta::hours(2)));
    config.voting_end = Set(Some(now - TimeDelta::hours(1)));
    config.save(&ctx.db).await.unwrap();
}

/// Sets show_leaderboard to true
pub async fn enable_leaderboard(ctx: &AppContext) {
    let config = ensure_config(ctx).await;
    let mut config = config.into_active_model();
    config.show_leaderboard = Set(true);
    config.save(&ctx.db).await.unwrap();
}

/// Creates a submission for a user
pub async fn create_submission_params() -> serde_json::Value {
    serde_json::json!({
        "figma_link": "https://figma.com/file/test",
        "design_image": "https://example.com/image.png",
        "target_user_and_goal": "Target users are designers who want to improve their workflow",
        "layout_explanation": "The layout uses a grid system for consistency",
        "style_interpretation": "Clean and minimal design following the brief",
        "key_trade_off": "Prioritized simplicity over feature density",
        "originality_confirmed": true,
        "template_compliance_confirmed": true,
        "future_improvements": "Add dark mode support"
    })
}

/// Creates a vote params for a submission
pub fn create_vote_params(submission_id: i32) -> serde_json::Value {
    serde_json::json!({
        "submission_id": submission_id,
        "problem_fit_score": 4,
        "clarity_score": 5,
        "style_interpretation_score": 3,
        "originality_score": 4,
        "overall_quality_score": 4
    })
}

/// Directly creates a submission in the database for a user
pub async fn create_submission_for_user(ctx: &AppContext, user_id: i32) -> submissions::Model {
    let submission = submissions::ActiveModel {
        user_id: Set(user_id),
        figma_link: Set("https://figma.com/file/test".to_string()),
        design_image: Set("https://example.com/image.png".to_string()),
        target_user_and_goal: Set("Target users are designers".to_string()),
        layout_explanation: Set("Grid layout".to_string()),
        style_interpretation: Set("Clean design".to_string()),
        key_trade_off: Set("Simplicity over features".to_string()),
        originality_confirmed: Set(true),
        template_compliance_confirmed: Set(true),
        future_improvements: Set(Some("Dark mode".to_string())),
        ..Default::default()
    };
    submission.insert(&ctx.db).await.unwrap()
}

/// Creates a vote assignment
pub async fn create_vote_assignment(
    ctx: &AppContext,
    user_id: i32,
    submission_id: i32,
) -> vote_assignments::Model {
    let assignment = vote_assignments::ActiveModel {
        user_id: Set(user_id),
        submission_id: Set(submission_id),
        ..Default::default()
    };
    assignment.insert(&ctx.db).await.unwrap()
}

/// Creates a vote
pub async fn create_vote(ctx: &AppContext, user_id: i32, submission_id: i32) -> votes::Model {
    let vote = votes::ActiveModel {
        user_id: Set(user_id),
        submission_id: Set(submission_id),
        problem_fit_score: Set(4),
        clarity_score: Set(5),
        style_interpretation_score: Set(3),
        originality_score: Set(4),
        overall_quality_score: Set(4),
        ..Default::default()
    };
    vote.insert(&ctx.db).await.unwrap()
}
