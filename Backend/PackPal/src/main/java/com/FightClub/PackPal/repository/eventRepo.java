package com.FightClub.PackPal.repository;

import com.FightClub.PackPal.model.event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface eventRepo extends JpaRepository<event, Integer> {
}
