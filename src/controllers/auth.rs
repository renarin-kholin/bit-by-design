use crate::{
    mailers::auth::AuthMailer,
    models::{_entities::users, users::LoginParams},
    views::auth::{CurrentResponse, LoginResponse},
};
use loco_rs::prelude::*;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

pub static EMAIL_DOMAIN_RE: OnceLock<Regex> = OnceLock::new();

fn get_allow_email_domain_re() -> &'static Regex {
    EMAIL_DOMAIN_RE.get_or_init(|| Regex::new(r"^\S+@\S+\.\S+$").expect("Failed to compile regex"))
}

#[derive(Debug, Deserialize, Serialize)]
pub struct OTPParams {
    pub email: String,
}

/// Creates a user login and returns a token
#[debug_handler]
async fn login(State(ctx): State<AppContext>, Json(params): Json<LoginParams>) -> Result<Response> {
    let Ok(mut user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        tracing::debug!(
            email = params.email,
            "login attempt with non-existent email"
        );
        return unauthorized("Invalid credentials!");
    };

    let mut valid = false;
    if let Some(otp) = &user.otp {
        valid = otp == &params.otp;
    };

    if !valid {
        return unauthorized("unauthorized!");
    }

    let jwt_secret = ctx.config.get_jwt_config()?;

    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;
    user = user.into_active_model().consume_otp(&ctx.db).await?;
    format::json(LoginResponse::new(&user, &token))
}
#[debug_handler]
async fn send_otp(
    State(ctx): State<AppContext>,
    Json(params): Json<OTPParams>,
) -> Result<Response> {
    let email_regex = get_allow_email_domain_re();
    if !email_regex.is_match(&params.email) {
        tracing::debug!(
            email = params.email,
            "The provided email is invalid or does not match the allowed domains"
        );
        return bad_request("invalid request");
    }
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        tracing::debug!(
            email = params.email,
            "login attempt with non-existent email"
        );
        return unauthorized("Invalid credentials!");
    };
    let user = user.into_active_model().create_otp(&ctx.db).await?;
    AuthMailer::send_otp(&ctx, &user).await?;
    format::empty_json()
}

#[debug_handler]
async fn current(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    format::json(CurrentResponse::new(&user))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/login", post(login))
        .add("/send-otp", post(send_otp))
        .add("/current", get(current))
}
