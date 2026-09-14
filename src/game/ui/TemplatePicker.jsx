import React from "react";
import { roomTemplates, getRoomTemplate } from "../data/roomTemplates";
import RoomSkin from "./RoomSkin";
export default function TemplatePicker({
  value,
  type,
  w = 4,
  h = 4,
  onChange,
}) {
  const selected = getRoomTemplate(value, type);
  return (
    <fieldset className="template-picker">
      <legend>Room style</legend>
      <p>Empty shells. Furniture stays exactly where you place it.</p>
      <div className="template-options">
        {roomTemplates.map((t) => (
          <button
            type="button"
            key={t.id}
            aria-pressed={selected.id === t.id}
            className={
              selected.id === t.id
                ? "template-option chosen"
                : "template-option"
            }
            onClick={() => onChange(t.id)}
          >
            <RoomSkin templateId={t.id} w={w} h={h} preview />
            <b>{t.name}</b>
            <small>{t.description}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
