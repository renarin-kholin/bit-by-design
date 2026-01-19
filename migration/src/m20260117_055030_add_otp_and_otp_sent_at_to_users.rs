use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        add_column(m, "users", "otp", ColType::StringNull).await?;
        add_column(
            m,
            "users",
            "otp_sent_at",
            ColType::TimestampWithTimeZoneNull,
        )
        .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        remove_column(m, "users", "otp").await?;
        remove_column(m, "users", "otp_sent_at").await?;
        Ok(())
    }
}
