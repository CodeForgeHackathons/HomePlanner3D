package models

import (
	"time"
)

type PlanningProject struct {
	ID                int64 `gorm:"primaryKey; autoIncrement"`
	User_id           int64 `gorm:"not null"`
	User              User  `gorm:"foreignKey:User_id"`
	Status            string
	Created_at        time.Time `gorm:"default:now()`
	Address           string
	Area              string
	Source            string
	LayoutType        string
	FamilyProfile     string
	Goal              string
	Prompt            string
	CeilingHeight     string
	FloorDelta        string
	RecognitionStatus string

	Rooms       []Room        `gorm:"foreignKey:ProjectID"`
	Walls       []Wall        `gorm:"foreignKey:ProjectID"`
	Constraints []Constraints `gorm:"foreignKey:ProjectID"`
	AIAnalysis  AIAnalysis    `gorm:"foreignKey:ProjectID"`
}
