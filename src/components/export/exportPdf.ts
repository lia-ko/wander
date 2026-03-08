import jsPDF from "jspdf";
import type { Trip } from "@/types";
import { TRANSPORT_META, FOOD_TYPE_META, ATTR_TYPE_META, HOTEL_COLOR } from "@/store/constants";

const MARGIN = 20;
const PAGE_W = 210; // A4mm
const CONTENT_W = PAGE_W - MARGIN * 2;

function hex(color: string) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return { r, g, b };
}

export async function exportTripPdf(trip: Trip, mapCanvas: HTMLCanvasElement | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  const pageCheck = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // ─── Cover Page ───
  const coverColor = hex(trip.days[0]?.color ?? "#E8845A");

  // Background accent bar
  doc.setFillColor(coverColor.r, coverColor.g, coverColor.b);
  doc.rect(0, 0, PAGE_W, 80, "F");

  // Trip emoji + name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.text(`${trip.emoji}  ${trip.name}`, MARGIN, 45);

  // Dates
  doc.setFontSize(14);
  doc.text(trip.dates, MARGIN, 58);

  // Hotel info
  y = 95;
  if (trip.hotel) {
    const hc = hex(HOTEL_COLOR);
    doc.setFillColor(hc.r, hc.g, hc.b);
    doc.roundedRect(MARGIN, y, CONTENT_W, 18, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`Accommodation: ${trip.hotel.name}`, MARGIN + 5, y + 8);
    doc.setFontSize(9);
    doc.text(trip.hotel.address, MARGIN + 5, y + 14);
    y += 25;
  }

  // Summary
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  const totalStops = trip.days.reduce((sum, d) => sum + d.pins.length, 0);
  doc.text(`${trip.days.length} days  ·  ${totalStops} stops`, MARGIN, y + 5);

  // ─── Map Screenshot ───
  if (mapCanvas) {
    doc.addPage();
    y = MARGIN;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.text("Map Overview", MARGIN, y);
    y += 8;

    const imgData = mapCanvas.toDataURL("image/png");
    const aspectRatio = mapCanvas.height / mapCanvas.width;
    const imgW = CONTENT_W;
    const imgH = imgW * aspectRatio;
    const clampedH = Math.min(imgH, 200);
    doc.addImage(imgData, "PNG", MARGIN, y, imgW, clampedH);
    y += clampedH + 10;
  }

  // ─── Day-by-day Itinerary ───
  for (const day of trip.days) {
    doc.addPage();
    y = MARGIN;

    // Day header
    const dc = hex(day.color);
    doc.setFillColor(dc.r, dc.g, dc.b);
    doc.roundedRect(MARGIN, y, CONTENT_W, 14, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`${day.label}${day.sublabel ? `  —  ${day.sublabel}` : ""}`, MARGIN + 5, y + 9);
    doc.setFontSize(9);
    doc.text(`${day.pins.length} stops`, MARGIN + CONTENT_W - 25, y + 9);
    y += 20;

    for (let i = 0; i < day.pins.length; i++) {
      const pin = day.pins[i];
      pageCheck(30);

      // Transport segment
      if (i > 0 && pin.transport) {
        const tmeta = TRANSPORT_META[pin.transport as keyof typeof TRANSPORT_META];
        if (!tmeta) { y += 10; continue; }
        const tc = hex(tmeta.color);
        doc.setDrawColor(tc.r, tc.g, tc.b);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(MARGIN + 6, y, MARGIN + 6, y + 8);
        doc.setLineDashPattern([], 0);

        doc.setFontSize(8);
        doc.setTextColor(tc.r, tc.g, tc.b);
        doc.text(`${tmeta.label}${pin.travelTime ? ` · ${pin.travelTime}` : ""}`, MARGIN + 12, y + 5);
        y += 10;
      }

      // Stop number circle
      doc.setFillColor(dc.r, dc.g, dc.b);
      doc.circle(MARGIN + 6, y + 4, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`${i + 1}`, MARGIN + 6, y + 5.5, { align: "center" });

      // Stop name
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.text(pin.name, MARGIN + 14, y + 5);

      // Category badge
      let badge = "";
      if (pin.foodType && FOOD_TYPE_META[pin.foodType]) {
        badge = FOOD_TYPE_META[pin.foodType].label;
      } else if (pin.attrType && ATTR_TYPE_META[pin.attrType]) {
        badge = ATTR_TYPE_META[pin.attrType].label;
      }

      // Details line
      y += 9;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const details: string[] = [];
      if (badge) details.push(badge);
      if (pin.rating) details.push(`★ ${pin.rating}`);
      if (pin.price) details.push(pin.price);
      if (pin.duration) details.push(pin.duration);
      if (pin.cost === null && pin.attrType) details.push("Free");
      else if (pin.cost) details.push(`Cost: ${pin.cost}/5`);
      if (details.length > 0) {
        doc.text(details.join("  ·  "), MARGIN + 14, y);
        y += 4;
      }

      // Note
      if (pin.note) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(pin.note, MARGIN + 14, y);
        y += 4;
      }

      y += 5;
    }
  }

  // ─── Save ───
  const filename = `${trip.name.replace(/\s+/g, "_").toLowerCase()}_itinerary.pdf`;
  doc.save(filename);
}
