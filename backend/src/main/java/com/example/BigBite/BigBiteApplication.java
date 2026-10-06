package com.example.BigBite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BigBiteApplication {

	public static void main(String[] args) {
		SpringApplication.run(BigBiteApplication.class, args);
	}

}

