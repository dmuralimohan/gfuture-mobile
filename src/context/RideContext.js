import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { rideService } from '../services/endpoints';
import * as ws from '../services/wsService';

const RideContext = createContext();

export const useRide = () => {
    const ctx = useContext(RideContext);
    if (!ctx) throw new Error('useRide must be used within RideProvider');
    return ctx;
};

export const RideProvider = ({ children }) => {
    const [currentRide, setCurrentRide] = useState(null);
    const [estimates, setEstimates] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rideHistory, setRideHistory] = useState([]);
    const [wsConnected, setWsConnected] = useState(false);

    // Connect WebSocket as customer
    const connectCustomerWs = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('accessToken');
            if (token) ws.connect('customer', token);
        } catch { /* ignore */ }
    }, []);

    // Listen for WebSocket events
    useEffect(() => {
        const unsubs = [
            ws.on('CONNECTED', () => setWsConnected(true)),
            ws.on('CONNECTION_STATUS', (msg) => setWsConnected(msg.connected)),
            ws.on('RIDE_ACCEPTED', (msg) => {
                setCurrentRide(prev => prev ? { ...prev, status: 'accepted', rider: msg.rider } : prev);
            }),
            ws.on('RIDE_STARTED', (msg) => {
                setCurrentRide(prev => prev && prev.id === msg.rideId ? { ...prev, status: 'in_progress' } : prev);
            }),
            ws.on('RIDE_COMPLETED', (msg) => {
                setCurrentRide(prev => prev && prev.id === msg.rideId ? { ...prev, status: 'completed', finalFare: msg.finalFare } : prev);
            }),
            ws.on('RIDE_CANCELLED', (msg) => {
                setCurrentRide(prev => prev && prev.id === msg.rideId ? { ...prev, status: 'cancelled' } : prev);
            }),
        ];
        return () => unsubs.forEach(fn => fn());
    }, []);

    const getEstimate = useCallback(async (vehicleType, distanceKm) => {
        setLoading(true);
        try {
            const { data } = await rideService.estimate({ vehicleType, distanceKm });
            setEstimates(data);
            return data;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const bookRide = useCallback(async (bookingData) => {
        setLoading(true);
        try {
            // Connect WS before booking so we get real-time updates
            await connectCustomerWs();
            const { data } = await rideService.book(bookingData);
            setCurrentRide(data.ride);
            return data.ride;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, [connectCustomerWs]);

    const fetchRideStatus = useCallback(async (rideId) => {
        try {
            const { data } = await rideService.getById(rideId);
            setCurrentRide(data.ride);
            return data.ride;
        } catch (err) {
            throw err;
        }
    }, []);

    const cancelRide = useCallback(async (rideId, reason) => {
        setLoading(true);
        try {
            await rideService.cancel(rideId, reason);
            setCurrentRide(null);
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const rateRide = useCallback(async (rideId, rating, comment) => {
        try {
            await rideService.rate(rideId, rating, comment);
            setCurrentRide(null);
        } catch (err) {
            throw err;
        }
    }, []);

    const fetchHistory = useCallback(async (params = {}) => {
        try {
            const { data } = await rideService.getAll(params);
            setRideHistory(data.rides || []);
            return data;
        } catch (err) {
            throw err;
        }
    }, []);

    const clearRide = useCallback(() => {
        setCurrentRide(null);
        setEstimates(null);
    }, []);

    return (
        <RideContext.Provider
            value={ {
                currentRide,
                estimates,
                loading,
                rideHistory,
                wsConnected,
                getEstimate,
                bookRide,
                fetchRideStatus,
                cancelRide,
                rateRide,
                fetchHistory,
                clearRide,
                setCurrentRide,
                connectCustomerWs,
            } }
        >
            { children }
        </RideContext.Provider>
    );
};
