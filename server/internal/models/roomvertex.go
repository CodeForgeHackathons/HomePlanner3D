package models

type RoomVertex struct {
	ID     int64 `gorm:"primaryKey;autoIncrement"`
	RoomID int64 `gorm:"not null"`
	X      string
	Y      string
}
