package com.property.intelligence.repository;

import com.property.intelligence.entity.LocationAnalysis;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationAnalysisRepository extends JpaRepository<LocationAnalysis, Long> {

    @EntityGraph(attributePaths = {"selectedAmenities"})
    List<LocationAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"selectedAmenities"})
    Optional<LocationAnalysis> findByIdAndUserId(Long id, Long userId);
}

