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
    var clientTs *string
    if p.ClientTimestamp != "" {
        clientTs = &p.ClientTimestamp
    }
    var planFile *model.PlanFile
    if p.PlanFileName != "" {
        planFile = &model.PlanFile{
            Name:    p.PlanFileName,
            Size:    atofPtr(&p.PlanFileSize),
            Type:    p.PlanFileType,
            Content: p.PlanFileContent,
        }
    }

    return &model.PlanningProject{
        ID:              fmt.Sprintf("%d", p.ID),
        Status:          p.Status,
        CreatedAt:       p.Created_at.Format(time.RFC3339),
        ClientTimestamp: clientTs,
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
            File:              planFile,
        },
    }
}
