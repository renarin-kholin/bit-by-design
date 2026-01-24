use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        add_column(m, "configs", "assigned", ColType::Boolean).await?;
        add_column(m, "configs", "created_scores", ColType::Boolean).await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        remove_column(m, "configs", "assigned").await?;
        remove_column(m, "configs", "created_scores").await?;
        Ok(())
    }
}
