use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "votes",
            &[
            
            ("id", ColType::PkAuto),
            
            ("problem_fit_score", ColType::Integer),
            ("clarity_score", ColType::Integer),
            ("style_interpretation_score", ColType::Integer),
            ("originality_score", ColType::Integer),
            ("overall_quality_score", ColType::Integer),
            ],
            &[
            ("user", ""),
            ("submission", ""),
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "votes").await
    }
}
