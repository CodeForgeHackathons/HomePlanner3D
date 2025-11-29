package models

import (
	"time"
)

type AIAnalysis struct {
	ID                  int64 `gorm:"primaryKey;autoIncrement"`
	ProjectID           int64 `gorm:"not null;unique"`
	IsValid             bool
	Justification       string
	TechnicalBasis      string    `gorm:"type:jsonb"`
	LimitationsRisks    string    `gorm:"type:jsonb"`
	ClarificationNeeded string    `gorm:"type:jsonb"`
	AnalyzedAt          time.Time `gorm:"default:now()"`
}
