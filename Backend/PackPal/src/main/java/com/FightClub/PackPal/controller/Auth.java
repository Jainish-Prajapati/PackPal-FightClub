package com.FightClub.PackPal.controller;

import com.FightClub.PackPal.model.user;
import com.FightClub.PackPal.repository.userRepo;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class Auth {

    @Autowired
    userRepo userRepo;

    @PostMapping("/login")
    public String login(@RequestParam String username, @RequestParam String password, HttpSession session) {
        user u = userRepo.findByEmail(username);

        if (u == null) {
            return "user not found";
        } else if (!u.getPassword().equals(password)) {
            return "Invalid password";
        }

        session.setAttribute("user", u);
        return "login success";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "Logged out successfully.";
    }

    @PostMapping("/signup")
    public String signup(@RequestParam String fName, @RequestParam String lName, @RequestParam String email, @RequestParam String password,
                         @RequestParam String role) {
        if (userRepo.findByEmail(email) != null) {
            return "Email is already registered";
        }

        user.Role userRole;
        try {
            userRole = user.Role.valueOf(role.toUpperCase()); // convert string to enum
        } catch (IllegalArgumentException e) {
            return "Invalid role. Allowed roles are: OWNER, ADMIN, MEMBER, VIEWER";
        }

        user newUser = new user();
        newUser.setFName(fName);
        newUser.setLName(lName);
        newUser.setEmail(email);
        newUser.setPassword(password);
        newUser.setRole(userRole);  // Default role can be MEMBER, change if needed

        // Save the new user to the database
        userRepo.save(newUser);

        return "Signup successful";
    }

}
