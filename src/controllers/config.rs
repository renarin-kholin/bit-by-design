#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use crate::models::{
    _entities::configs::{ActiveModel, Entity, Model},
    admins, users,
};
use loco_rs::controller::extractor::auth;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub submission_start: Option<DateTimeWithTimeZone>,
    pub submission_end: Option<DateTimeWithTimeZone>,
    pub voting_start: Option<DateTimeWithTimeZone>,
    pub voting_end: Option<DateTimeWithTimeZone>,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.submission_start = Set(self.submission_start);
        item.submission_end = Set(self.submission_end);
        item.voting_start = Set(self.voting_start);
        item.voting_end = Set(self.voting_end);
    }
}

async fn load_item(ctx: &AppContext) -> Result<Model> {
    let item = Entity::find().one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

#[debug_handler]
pub async fn update(
    State(ctx): State<AppContext>,
    auth: auth::JWT,
    Json(params): Json<Params>,
) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    let is_admin = admins::Model::is_admin(&ctx.db, user.id).await?;
    if !is_admin {
        return unauthorized("unauthorized access");
    }

    let item = load_item(&ctx).await?;
    let mut item = item.into_active_model();
    params.update(&mut item);
    let item = item.update(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn get_one(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(load_item(&ctx).await?)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/config/")
        .add("/", get(get_one))
        .add("/", put(update))
}
