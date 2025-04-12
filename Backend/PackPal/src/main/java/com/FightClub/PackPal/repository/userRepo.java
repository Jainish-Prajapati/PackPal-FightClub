package com.FightClub.PackPal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.FightClub.PackPal.model.user;

public interface userRepo extends JpaRepository<user,Integer> {
    user findByEmail(String email);
}
