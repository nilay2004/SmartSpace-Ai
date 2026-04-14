/// <reference path="../core/configuration.ts" />

namespace BP3D.Core {

  /** Dimensioning in Inch. */
  export const dimInch: string = "inch";

  /** Dimensioning in Meter. */
  export const dimMeter: string = "m";

  /** Dimensioning in Centi Meter. */
  export const dimCentiMeter: string = "cm";

  /** Dimensioning in Milli Meter. */
  export const dimMilliMeter: string = "mm";

  /** Dimensioning functions. */
  export class Dimensioning {
    /** Converts cm to dimensioning string.
     * @param cm Centi meter value to be converted.
     * @returns String representation.
     */
    public static cmToMeasure(cm: number): string {
      switch (Core.Configuration.getStringValue(Core.configDimUnit)) {
        case dimInch:
          var realFeet = ((cm * 0.393700) / 12);
          var feet = Math.floor(realFeet);
          var inches = Math.round((realFeet - feet) * 12);
          return feet + "'" + inches + '"';
        case dimMilliMeter:
          return "" + Math.round(10 * cm) + " mm";
        case dimCentiMeter:
          return "" + Math.round(10 * cm) / 10 + " cm";
        case dimMeter:
        default:
          return "" + Math.round(10 * cm) / 1000 + " m";
      }
    }

    /** Converts cm^2 to area string (m² / cm² / mm² / ft² depending on unit setting). */
    public static cm2ToAreaMeasure(cm2: number): string {
      const unit = Core.Configuration.getStringValue(Core.configDimUnit);
      switch (unit) {
        case dimInch: {
          const ft2 = cm2 / (30.48 * 30.48);
          return `${Math.round(ft2 * 100) / 100} ft²`;
        }
        case dimMilliMeter: {
          const mm2 = cm2 * 100;
          return `${Math.round(mm2)} mm²`;
        }
        case dimCentiMeter: {
          return `${Math.round(cm2 * 10) / 10} cm²`;
        }
        case dimMeter:
        default: {
          const m2 = cm2 / 10000;
          return `${Math.round(m2 * 100) / 100} m²`;
        }
      }
    }
  }
}