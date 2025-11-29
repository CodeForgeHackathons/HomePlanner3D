package models

type Constraints struct {
	ID             int64 `gorm:"not null; autoIncrement"`
	ProjectID      int64 `gorm:"not null: unique"`
	ForbiddenMoves string
	RegionRules    string
}
