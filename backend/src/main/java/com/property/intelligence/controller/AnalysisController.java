package com.property.intelligence.controller;

import com.property.intelligence.dto.AnalysisHistoryItem;
import com.property.intelligence.dto.AnalysisRequest;
import com.property.intelligence.dto.AnalysisResponse;
import com.property.intelligence.security.UserPrincipal;
import com.property.intelligence.service.LocationAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/analysis", "/api/analyses"})
public class AnalysisController {

    private final LocationAnalysisService analysisService;

    public AnalysisController(LocationAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping
    public ResponseEntity<AnalysisResponse> analyzeLocation(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AnalysisRequest request) {
        AnalysisResponse response = analysisService.analyzeLocation(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/score")
    public ResponseEntity<com.property.intelligence.scoring.ScoringResult> calculateScores(
            @Valid @RequestBody com.property.intelligence.scoring.ScoreRequest request) {
        com.property.intelligence.scoring.ScoringResult result = analysisService.calculateScoresOnly(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<AnalysisResponse> getAnalysisById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long id) {
        AnalysisResponse response = analysisService.getAnalysisById(id, userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<AnalysisHistoryItem>> getAnalysisHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<AnalysisHistoryItem> history = analysisService.getAnalysisHistory(userPrincipal.getId());
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<?> deleteAnalysis(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long id) {
        analysisService.deleteAnalysis(id, userPrincipal.getId());
        return ResponseEntity.ok(Map.of(
                "message", "Analysis deleted successfully",
                "deletedId", id
        ));
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearAnalysisHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        analysisService.clearAnalysisHistory(userPrincipal.getId());
        return ResponseEntity.ok(Map.of(
                "message", "All analysis history cleared successfully"
        ));
    }
}

