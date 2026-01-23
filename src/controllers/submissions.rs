#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::controller::extractor::auth;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::{
    admins,
    submissions::{self, ActiveModel, Entity, Model},
    users,
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub figma_link: String,
    pub design_image: String,
    pub target_user_and_goal: String,
    pub layout_explanation: String,
    pub style_interpretation: String,
    pub key_trade_off: String,
    pub originality_confirmed: bool,
    pub template_compliance_confirmed: bool,
    pub future_improvements: Option<String>,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.figma_link = Set(self.figma_link.clone());
        item.design_image = Set(self.design_image.clone());
        item.target_user_and_goal = Set(self.target_user_and_goal.clone());
        item.layout_explanation = Set(self.layout_explanation.clone());
        item.style_interpretation = Set(self.style_interpretation.clone());
        item.key_trade_off = Set(self.key_trade_off.clone());
        item.originality_confirmed = Set(self.originality_confirmed);
        item.template_compliance_confirmed = Set(self.template_compliance_confirmed);
        item.future_improvements = Set(self.future_improvements.clone());
    }
}

async fn load_item(ctx: &AppContext, id: i32) -> Result<Model> {
    let item = Entity::find_by_id(id).one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

// #[debug_handler]
// pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
//     format::json(Entity::find().all(&ctx.db).await?)
// }
//TODO: Only accept submissions during submission period
#[debug_handler]
pub async fn add(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    let item = submissions::Model::find_by_userid(&ctx.db, user.id).await?;
    if let Some(_) = item {
        return bad_request("submission already exists.");
    }

    let mut item = ActiveModel {
        ..Default::default()
    };
    item.user_id = Set(user.id);
    params.update(&mut item);
    let item = item.insert(&ctx.db).await?;
    format::json(item)
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
    let is_admin = admins::Model::is_admin(&ctx.db, item.user_id).await?;
    if item.user_id != user.id && !is_admin {
        return unauthorized("unauthorized access.");
    }
    let mut item = item.into_active_model();
    params.update(&mut item);
    let item = item.update(&ctx.db).await?;
    format::json(item)
}
//TODO: Allow for loading submissions that have been assigned to a particular user.
#[debug_handler]
pub async fn get_one(
    auth: auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    let is_admin = admins::Model::is_admin(&ctx.db, user.id).await?;
    let item = load_item(&ctx, id).await?;
    if item.user_id != user.id && !is_admin {
        return unauthorized("unauthorized access.");
    }
    format::json(item)
}

#[debug_handler]
pub async fn get_mine(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    let item = submissions::Model::find_by_userid(&ctx.db, user.id).await?;
    if let Some(item) = item {
        format::json(item)
    } else {
        Err(Error::NotFound)
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/submissions/")
        .add("/", post(add))
        .add("/mine", get(get_mine))
        .add("{id}", get(get_one))
        .add("{id}", put(update))
        .add("{id}", patch(update))
}
