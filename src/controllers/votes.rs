#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use chrono::Local;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::{
    _entities::votes::{self, ActiveModel, Entity, Model},
    configs, users,
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub submission_id: i32,
    pub problem_fit_score: i32,
    pub clarity_score: i32,
    pub style_interpretation_score: i32,
    pub originality_score: i32,
    pub overall_quality_score: i32,
}

impl Params {
    /// Validates that all score fields are between 0 and 5 (inclusive).
    fn validate(&self) -> Result<()> {
        let scores = [
            ("problem_fit_score", self.problem_fit_score),
            ("clarity_score", self.clarity_score),
            (
                "style_interpretation_score",
                self.style_interpretation_score,
            ),
            ("originality_score", self.originality_score),
            ("overall_quality_score", self.overall_quality_score),
        ];

        for (name, value) in scores {
            if !(0..=5).contains(&value) {
                return Err(Error::BadRequest(format!(
                    "{} must be between 0 and 5, got {}",
                    name, value
                )));
            }
        }

        Ok(())
    }

    fn update(&self, item: &mut ActiveModel, user_id: i32) {
        item.user_id = Set(user_id);
        item.submission_id = Set(self.submission_id);
        item.problem_fit_score = Set(self.problem_fit_score);
        item.clarity_score = Set(self.clarity_score);
        item.style_interpretation_score = Set(self.style_interpretation_score);
        item.originality_score = Set(self.originality_score);
        item.overall_quality_score = Set(self.overall_quality_score);
    }
}

async fn load_item(ctx: &AppContext, id: i32) -> Result<Model> {
    let item = Entity::find_by_id(id).one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

#[debug_handler]
pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Entity::find().all(&ctx.db).await?)
}

#[debug_handler]
pub async fn mine(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;

    format::json(
        Entity::find()
            .filter(votes::Column::UserId.eq(user.id))
            .all(&ctx.db)
            .await?,
    )
}

#[debug_handler]
pub async fn add(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    params.validate()?;

    // Check if user already voted on this submission
    let existing_vote = Entity::find()
        .filter(votes::Column::UserId.eq(user.id))
        .filter(votes::Column::SubmissionId.eq(params.submission_id))
        .one(&ctx.db)
        .await?;
    if existing_vote.is_some() {
        return bad_request("you have already voted on this submission");
    }

    // Check voting period
    let config = configs::Entity::find().one(&ctx.db).await?;
    if let Some(config) = config {
        let now = Local::now();
        let now = DateTimeWithTimeZone::from(now);
        if let (Some(vs), Some(ve)) = (config.voting_start, config.voting_end) {
            if vs <= now && now <= ve {
                let mut item = ActiveModel {
                    ..Default::default()
                };
                params.update(&mut item, user.id);
                let item = item.insert(&ctx.db).await?;
                return format::json(item);
            }
        }
    }
    bad_request("voting is not currently open")
}

#[debug_handler]
pub async fn update(
    auth: auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    let item = load_item(&ctx, id).await?;
    // Only allow updating own votes
    if item.user_id != user.id {
        return unauthorized("unauthorized access.");
    }
    params.validate()?;

    // Check voting period
    let config = configs::Entity::find().one(&ctx.db).await?;
    if let Some(config) = config {
        let now = Local::now();
        let now = DateTimeWithTimeZone::from(now);
        if let (Some(vs), Some(ve)) = (config.voting_start, config.voting_end) {
            if vs <= now && now <= ve {
                let mut item = item.into_active_model();
                params.update(&mut item, user.id);
                let item = item.update(&ctx.db).await?;
                return format::json(item);
            }
        }
    }
    bad_request("voting is not currently open")
}

#[debug_handler]
pub async fn remove(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    format::json(load_item(&ctx, id).await?)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/votes/")
        .add("/", post(add))
        .add("/mine", get(mine))
}
