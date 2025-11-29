package models

type Wall struct {
	ID          int64 `gorm:"primaryKey;autoIncrement"`
	ProjectID   int64 `gorm:"not null"`
	StartX      string
	StartY      string
	EndX        string
	EndY        string
	LoadBearing bool
	Thickness   string
}
