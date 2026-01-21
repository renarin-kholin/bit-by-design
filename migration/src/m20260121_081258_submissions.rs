use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "submissions",
            &[
            
            ("id", ColType::PkAuto),
            
            ("figma_link", ColType::String),
            ("design_image", ColType::String),
            ("target_user_and_goal", ColType::String),
            ("layout_explanation", ColType::String),
            ("style_interpretation", ColType::String),
            ("key_trade_off", ColType::String),
            ("originality_confirmed", ColType::Boolean),
            ("template_compliance_confirmed", ColType::Boolean),
            ("future_improvements", ColType::StringNull),
            ],
            &[
            ("users", ""),
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "submissions").await
    }
}
