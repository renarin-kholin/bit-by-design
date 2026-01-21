use crate::{controllers::submissions, models::_entities::submissions::Column};
use loco_rs::model::{self, ModelError, ModelResult};
use sea_orm::entity::prelude::*;

pub use super::_entities::submissions::{ActiveModel, Entity, Model};
pub type Submissions = Entity;

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> std::result::Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if !insert && self.updated_at.is_unchanged() {
            let mut this = self;
            this.updated_at = sea_orm::ActiveValue::Set(chrono::Utc::now().into());
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

// implement your read-oriented logic here
impl Model {
    pub async fn find_by_userid(
        db: &DatabaseConnection,
        user_id: i32,
    ) -> ModelResult<Option<Self>> {
        let submission = Entity::find()
            .filter(
                model::query::condition()
                    .eq(Column::UserId, user_id)
                    .build(),
            )
            .one(db)
            .await?;
        Ok(submission)
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
