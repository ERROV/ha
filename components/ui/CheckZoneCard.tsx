"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { FaSearch, FaMapMarkerAlt, FaNetworkWired, FaCity } from "react-icons/fa";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const CheckZoneCard: React.FC = () => {
  const [zoneValue, setZoneValue] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zoneResult, setZoneResult] = useState('');
  const [deviceResult, setDeviceResult] = useState('');
  const [neighborhoodResult, setNeighborhoodResult] = useState('');

  const { data: neighborhoodData, error } = useSWR('/api/neighborhoods', fetcher);

  const zones = [
    { from: '96415710000', to: '96415759999', name: 'MMN Zone' },
    { from: '96415760000', to: '96415789999', name: 'BYA Zone' },
    { from: '96415790000', to: '96415799999', name: 'KDY Zone' },
    { from: '96418310000', to: '96418349999', name: 'OMC Zone' },
    { from: '96418350000', to: '96418389999', name: 'SHB Zone' },
    { from: '96418390000', to: '96418399999', name: 'BLD Zone' },
  ];

  const calculateZone = (val: string) => {
    const trimmedVal = val.trim();
    if (!trimmedVal) return setZoneResult('');
    if (trimmedVal.length !== 11) return setZoneResult('Out of Range');

    const match = zones.find(z => trimmedVal >= z.from && trimmedVal <= z.to);
    setZoneResult(match ? match.name : 'Out of Range');
  };

  const checkDevice = (input: string) => {
    const upperInput = input.trim().toUpperCase();
    if (!upperInput) return setDeviceResult('');

    const startsWith = (arr: string[], len: number) =>
      arr.some(prefix => upperInput.startsWith(prefix.substring(0, len)));

    const result =
      startsWith(['15', '16', '18', '19', '20', '21', '22', '24', '25', '27', '28', '40', '42', '1A', '1B', '1C', '1D', '1E', '1F', '2C', '2E', '2F', '2H', '2A', 'FH'], 2) ? 'FHTT' :
        startsWith(['292', '293', '296', '298'], 3) ||
          startsWith(['297', '29A', '2B0', '2B1', '2B2', '2B3', '2B7'], 3) ? 'Calix' :
          startsWith(['297A', '297B', '297C', '297D', '297E', '297F'], 4) ||
            startsWith(['299A', '299B', '299C', '299D', '299E', '299F', '2992', '2993', '2994', '2995', '2996', '2997', '2998', '2999'], 4) ? 'Calix' :
            startsWith(['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'], 2) ? 'ZTE 660 or 620' :
              startsWith(['D0', 'D1'], 2) ? 'ZTE 673' :
                startsWith(['CA', 'CB', 'CC', 'CD', 'CE', 'CF'], 2) ? 'ZTE 663' :
                  upperInput.startsWith('CX') ? 'Calix' :
                    upperInput.startsWith('35') ? 'Tenda' :
                      upperInput.startsWith('6A2') || upperInput.startsWith('HWTC6A2') ? 'WW1G' :
                        upperInput.startsWith('6A7') || upperInput.startsWith('HWTC6A7') ? 'WW5G' :
                          upperInput.startsWith('6A8') || upperInput.startsWith('HWTC6A8') ? 'WW5G' :
                            upperInput.startsWith('RE') ? 'Removal' :
                              upperInput.startsWith('ZTE') || upperInput.startsWith('G') ? 'ZTE 660 or 620' :
                                'Unknown';

    setDeviceResult(result);
  };

  const findParent = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed || !neighborhoodData) {
      setNeighborhoodResult('');
      return;
    }

    const found = neighborhoodData.find((n: any) => n.district === trimmed);
    setNeighborhoodResult(found ? `Parent: ${found.parent}` : 'Not Found');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      // Using same wrapper classes as SubnetCalculator
      className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:border-primary/50"
    >
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
        <FaMapMarkerAlt className="text-primary" />
        Zone & Device Check
      </h3>

      <div className="space-y-4 flex-1">
        {/* Zone */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={zoneValue}
              onChange={(e) => {
                setZoneValue(e.target.value);
                calculateZone(e.target.value);
              }}
              placeholder="Zone (PPPoE)"
              className="w-full p-2 pl-8 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder-muted-foreground text-sm"
            />
            <FaSearch className="absolute left-2.5 top-3 text-muted-foreground text-xs" />
          </div>
          {zoneResult && (
            <div className={`text-xs font-semibold px-1 ${zoneResult.includes('Out of Range') ? 'text-destructive' : 'text-primary'
              }`}>
              {zoneResult}
            </div>
          )}
        </div>

        {/* Device */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={deviceType}
              onChange={(e) => {
                setDeviceType(e.target.value);
                checkDevice(e.target.value);
              }}
              placeholder="Device Type"
              className="w-full p-2 pl-8 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder-muted-foreground text-sm"
            />
            <FaNetworkWired className="absolute left-2.5 top-3 text-muted-foreground text-xs" />
          </div>
          {deviceResult && (
            <div className={`text-xs font-semibold px-1 ${deviceResult === 'Unknown' ? 'text-destructive' : 'text-primary'
              }`}>
              {deviceResult}
            </div>
          )}
        </div>

        {/* Neighborhood */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                findParent(e.target.value);
              }}
              placeholder="District Parent"
              className="w-full p-2 pl-8 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder-muted-foreground text-sm"
            />
            <FaCity className="absolute left-2.5 top-3 text-muted-foreground text-xs" />
          </div>
          {neighborhoodResult && (
            <div className={`text-xs font-semibold px-1 ${neighborhoodResult === 'Not Found' ? 'text-destructive' : 'text-primary'
              }`}>
              {neighborhoodResult}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CheckZoneCard;