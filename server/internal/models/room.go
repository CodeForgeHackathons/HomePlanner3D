package models

type Room struct {
	ID        int64 `gorm:"primaryKey;autoIncrement"`
	ProjectID int64 `gorm:"not null"`
	Name      string
	Height    string
	Vertices  []RoomVertex `gorm:"foreignKey:RoomID"`
}
