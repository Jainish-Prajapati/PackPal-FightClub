package com.FightClub.PackPal.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;

    private String description;

    private String source;

    private String destination;

    private String ownerEmail;

    private String purpose;

    private Date startDate;

    private Date endDate;

    private Status status;

    public enum Status {
        ONGOING, ENDED
    }
}
