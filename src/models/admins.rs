use crate::models::_entities::admins;
use loco_rs::model::{self, ModelResult};
use sea_orm::entity::prelude::*;

pub use super::_entities::admins::{ActiveModel, Entity, Model};
pub type Admins = Entity;

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
    pub async fn is_admin(db: &DatabaseConnection, user_id: i32) -> ModelResult<bool> {
        let admin = admins::Entity::find()
            .filter(
                model::query::condition()
                    .eq(admins::Column::UserId, user_id)
                    .build(),
            )
            .one(db)
            .await?;
        Ok(admin.is_some())
    }
}

// implement your write-oriented logic here
impl ActiveModel {}

// implement your custom finders, selectors oriented logic here
impl Entity {}
