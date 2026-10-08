"use client";
import {useEffect,useState} from "react";
export function DashboardClock(){const [now,setNow]=useState(new Date());useEffect(()=>{const i=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(i)},[]);return <div className="clock"><b>{now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</b><span>{now.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}</span></div>}
