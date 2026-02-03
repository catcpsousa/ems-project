package com.ems.backend.modules.admin.dtos;

import com.ems.backend.modules.admin.entities.ContentReport.ReportStatus;

import lombok.Data;

@Data
public class ResolveReportRequest {
    private ReportStatus status;
    private String adminNotes;
}
