package graph

import (
	"ServerBTI/graph/model"
	"ServerBTI/internal/models"
	"fmt"
	"strconv"
	"time"
)

func atofPtr(s *string) float64 {
	if s == nil {
		return 0
	}
	v, err := strconv.ParseFloat(*s, 64)
	if err != nil {
		return 0
	}
	return v
}

func ConvertDbProjectToGraph(p *models.PlanningProject) *model.PlanningProject {
	return &model.PlanningProject{
		ID:        fmt.Sprintf("%d", p.ID),
		Status:    p.Status,
		CreatedAt: p.Created_at.Format(time.RFC3339),
		Plan: &model.Plan{
			Address:           p.Address,
			Area:              atofPtr(&p.Area),
			Source:            p.Source,
			LayoutType:        p.LayoutType,
			FamilyProfile:     p.FamilyProfile,
			Goal:              p.Goal,
			Prompt:            p.Prompt,
			CeilingHeight:     atofPtr(&p.CeilingHeight),
			FloorDelta:        atofPtr(&p.FloorDelta),
			RecognitionStatus: p.RecognitionStatus,
		},
	}
}
