import {
  TEXT_MAX,
  AGE_MIN,
  AGE_MAX,
  TEXT_FIELDS,
  FIELD_LABELS,
  HAIR_COLOURS,
  CLOTHING_COLOURS,
  VOICES,
  ENVIRONMENTS,
} from './fields.js';

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const inSet = (set, id) => set.some((item) => item.id === id);

export function validateIntake(input) {
  const data = input !== null && typeof input === 'object' ? input : {};
  const errors = {};

  for (const key of TEXT_FIELDS) {
    const value = text(data[key]);
    if (value === '') errors[key] = `${FIELD_LABELS[key]} is required.`;
    else if (value.length > TEXT_MAX)
      errors[key] =
        `${FIELD_LABELS[key]} must be at most ${TEXT_MAX} characters.`;
  }

  const rawAge = String(data.age ?? '').trim();
  if (rawAge === '') errors.age = `${FIELD_LABELS.age} is required.`;
  else if (
    !/^\d+$/.test(rawAge) ||
    Number(rawAge) < AGE_MIN ||
    Number(rawAge) > AGE_MAX
  )
    errors.age = `${FIELD_LABELS.age} must be a whole number from ${AGE_MIN} to ${AGE_MAX}.`;

  if (
    !inSet(HAIR_COLOURS, data.hair) ||
    !inSet(CLOTHING_COLOURS, data.clothing)
  )
    errors.appearance = `${FIELD_LABELS.appearance} needs a hair colour and a clothing colour.`;
  if (!inSet(VOICES, data.voice))
    errors.voice = `${FIELD_LABELS.voice} is required.`;
  if (!inSet(ENVIRONMENTS, data.environment))
    errors.environment = `${FIELD_LABELS.environment} is required.`;

  return { ok: Object.keys(errors).length === 0, errors };
}

export function normalizeIntake(input) {
  return {
    name: text(input.name),
    age: Number(String(input.age).trim()),
    hair: input.hair,
    clothing: input.clothing,
    character: text(input.character),
    hobbies: text(input.hobbies),
    background: text(input.background),
    voice: input.voice,
    environment: input.environment,
  };
}
