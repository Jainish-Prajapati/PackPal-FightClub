package com.FightClub.PackPal.controller;

import com.FightClub.PackPal.model.*;
import com.FightClub.PackPal.repository.eventRepo;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/event")
public class eventController {

    @Autowired
    eventRepo eventRepo;

    @PostMapping("/create")
    public String createEvent(@RequestBody event e, HttpSession session) {

        System.out.println("Create event");
        // Check session
        user sessionUser = (user) session.getAttribute("user");
        System.out.println(sessionUser);

        if (sessionUser == null) {
            return "You must be logged in to create an event.";
        }

        // Check if user is an OWNER
        if (!sessionUser.getRole().equals(user.Role.OWNER)) {
            return "Access denied: Only users with OWNER role can create events.";
        }

        // Set ownerEmail in event
        e.setOwnerEmail(sessionUser.getEmail());

        e.setStatus(event.Status.ONGOING);

        // Save event
        eventRepo.save(e);

        return "Event created successfully.";
    }
}
