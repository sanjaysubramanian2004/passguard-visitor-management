import React, { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext.tsx';

export interface FacilityLocation {
  id: string;
  name: string;
  shortName: string;
  code: string;
  building: string;
}

export const FACILITY_LOCATIONS: FacilityLocation[] = [
  { id: 'hq_tower_a', name: 'HQ Tower A - Main Lobby', shortName: 'HQ Tower A', code: 'TWR-A', building: 'Main Campus' },
  { id: 'hq_tower_b', name: 'HQ Tower B - Executive Suites', shortName: 'HQ Tower B', code: 'TWR-B', building: 'Main Campus' },
  { id: 'north_campus', name: 'North Campus - Engineering Gate', shortName: 'North Campus', code: 'N-GATE', building: 'Tech Park' },
  { id: 'south_campus', name: 'South Campus - Logistics Center', shortName: 'South Campus', code: 'S-LOG', building: 'Distribution Hub' },
  { id: 'west_hub', name: 'West Innovation Hub - Gate 03', shortName: 'West Hub', code: 'W-HUB', building: 'R&D Wing' }
];

interface LocationContextType {
  currentLocation: FacilityLocation;
  locations: FacilityLocation[];
  selectLocation: (locationId: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success } = useToast();
  const [currentLocation, setCurrentLocation] = useState<FacilityLocation>(() => {
    const savedId = localStorage.getItem('passguard_location_id');
    const found = FACILITY_LOCATIONS.find(l => l.id === savedId);
    return found || FACILITY_LOCATIONS[0];
  });

  const selectLocation = (locationId: string) => {
    const found = FACILITY_LOCATIONS.find(l => l.id === locationId);
    if (found) {
      setCurrentLocation(found);
      localStorage.setItem('passguard_location_id', found.id);
      success('Facility Location Switched', `Active reception gate set to ${found.name}`);
    }
  };

  return (
    <LocationContext.Provider value={{ currentLocation, locations: FACILITY_LOCATIONS, selectLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
