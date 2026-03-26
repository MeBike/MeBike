-- CreateIndex
CREATE UNIQUE INDEX idx_unique_active_incident_bike 
ON incident_reports (bike_id) 
WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS');

CREATE UNIQUE INDEX idx_unique_active_incident_rental 
ON incident_reports (rental_id) 
WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS'); AND rental_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_active_incident_station 
ON incident_reports (station_id) 
WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS'); AND station_id IS NOT NULL;
