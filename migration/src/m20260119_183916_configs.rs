use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "configs",
            &[
            
            ("id", ColType::PkAuto),
            
            ("submission_start", ColType::TimestampWithTimeZoneNull),
            ("submission_end", ColType::TimestampWithTimeZoneNull),
            ("voting_start", ColType::TimestampWithTimeZoneNull),
            ("voting_end", ColType::TimestampWithTimeZoneNull),
            ],
            &[
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "configs").await
    }
}
