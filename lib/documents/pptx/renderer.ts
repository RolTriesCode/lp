if (typeof window !== "undefined") {
  throw new Error("PPTX export renderer modules cannot be imported in client components.");
}

import pptxgen from "pptxgenjs";
import type { Presentation, Slide } from "@/schemas/presentation";

type ThemeStyle = {
  background: string;
  textColor: string;
  accentColor: string;
  fontFace: string;
};

const THEME_STYLES: Record<string, ThemeStyle> = {
  minimal: {
    background: "FFFFFF",
    textColor: "1E293B",
    accentColor: "475569",
    fontFace: "Arial",
  },
  classroom: {
    background: "EDE9FE",
    textColor: "2E1065",
    accentColor: "5B21B6",
    fontFace: "Segoe UI",
  },
  academic: {
    background: "FBFBFA",
    textColor: "1C1917",
    accentColor: "1E3A8A",
    fontFace: "Georgia",
  },
  elementary: {
    background: "FFFBEB",
    textColor: "78350F",
    accentColor: "D97706",
    fontFace: "Trebuchet MS",
  },
  science: {
    background: "0F172A",
    textColor: "F1F5F9",
    accentColor: "06B6D4",
    fontFace: "Verdana",
  },
  mathematics: {
    background: "FAFAF9",
    textColor: "292524",
    accentColor: "DC2626",
    fontFace: "Lucida Console",
  },
};

/**
 * Renders a canonical Presentation object to a native PPTX file buffer.
 */
export async function generatePptxFile(presentation: Presentation): Promise<Buffer> {
  const ppts = new pptxgen();
  ppts.layout = "LAYOUT_16x9";

  const themeStyle = THEME_STYLES[presentation.theme] || THEME_STYLES.minimal;

  presentation.slides.forEach((slideItem, index) => {
    const slide = ppts.addSlide();

    // 1. Set background color
    slide.background = { fill: themeStyle.background };

    // 2. Set presenter speaker notes
    if (slideItem.speakerNotes) {
      slide.addNotes(slideItem.speakerNotes);
    }

    // 3. Render layout elements
    renderSlideLayout(slide, slideItem, themeStyle, index);
  });

  const buffer = await ppts.write({ outputType: "nodebuffer" });
  return buffer as Buffer;
}

function renderSlideLayout(
  slide: any,
  slideItem: Slide,
  theme: ThemeStyle,
  index: number
) {
  const { title, subtitle, bullets, body, layout } = slideItem;

  // Add a subtle slide index footer
  slide.addText(`Slide ${index + 1}`, {
    x: 0.5,
    y: 7.0,
    w: 2.0,
    h: 0.3,
    fontSize: 9,
    fontFace: theme.fontFace,
    color: theme.textColor,
    valign: "middle",
  });

  switch (layout) {
    case "title":
      // Large Centered Title Slide
      slide.addText(title, {
        x: 1.0,
        y: 2.2,
        w: 11.3,
        h: 1.8,
        fontSize: 36,
        fontFace: theme.fontFace,
        color: theme.textColor,
        bold: true,
        align: "center",
        valign: "middle",
      });

      if (subtitle) {
        slide.addText(subtitle, {
          x: 1.0,
          y: 4.2,
          w: 11.3,
          h: 0.8,
          fontSize: 18,
          fontFace: theme.fontFace,
          color: theme.accentColor,
          align: "center",
          valign: "top",
        });
      }
      break;

    case "bullets":
      // Standard Title & Bullet List
      slide.addText(title, {
        x: 0.8,
        y: 0.8,
        w: 11.7,
        h: 1.0,
        fontSize: 28,
        fontFace: theme.fontFace,
        color: theme.textColor,
        bold: true,
        valign: "middle",
      });

      if (bullets && bullets.length > 0) {
        const bulletObjects = bullets.slice(0, 5).map((bullet) => ({
          text: bullet,
          options: {
            bullet: true,
            fontSize: 16,
            fontFace: theme.fontFace,
            color: theme.textColor,
            lineSpacing: 24,
          },
        }));

        slide.addText(bulletObjects, {
          x: 0.8,
          y: 2.0,
          w: 11.7,
          h: 4.5,
          valign: "top",
        });
      }
      break;

    case "two_column":
      // Side-by-side Left Column Body / Right Column Bullets
      slide.addText(title, {
        x: 0.8,
        y: 0.8,
        w: 11.7,
        h: 1.0,
        fontSize: 28,
        fontFace: theme.fontFace,
        color: theme.textColor,
        bold: true,
        valign: "middle",
      });

      // Left Column Text
      slide.addText(body || "", {
        x: 0.8,
        y: 2.0,
        w: 5.6,
        h: 4.5,
        fontSize: 15,
        fontFace: theme.fontFace,
        color: theme.textColor,
        valign: "top",
      });

      // Right Column Bullets
      if (bullets && bullets.length > 0) {
        const rightBulletObjects = bullets.slice(0, 5).map((b) => ({
          text: b,
          options: {
            bullet: true,
            fontSize: 15,
            fontFace: theme.fontFace,
            color: theme.textColor,
            lineSpacing: 22,
          },
        }));

        slide.addText(rightBulletObjects, {
          x: 6.8,
          y: 2.0,
          w: 5.7,
          h: 4.5,
          valign: "top",
        });
      }
      break;

    case "quote":
      // Elegant centered quote
      slide.addText(`“${title}”`, {
        x: 1.5,
        y: 2.0,
        w: 10.3,
        h: 2.5,
        fontSize: 22,
        fontFace: theme.fontFace,
        color: theme.textColor,
        italic: true,
        align: "center",
        valign: "middle",
      });

      if (subtitle) {
        slide.addText(`— ${subtitle}`, {
          x: 1.5,
          y: 4.8,
          w: 10.3,
          h: 0.8,
          fontSize: 16,
          fontFace: theme.fontFace,
          color: theme.accentColor,
          align: "center",
          valign: "top",
        });
      }
      break;

    case "big_stat":
      // Large focus word / statistic callout
      slide.addText(title, {
        x: 1.0,
        y: 2.0,
        w: 11.3,
        h: 2.2,
        fontSize: 54,
        fontFace: theme.fontFace,
        color: theme.accentColor,
        bold: true,
        align: "center",
        valign: "middle",
      });

      if (subtitle) {
        slide.addText(subtitle, {
          x: 1.0,
          y: 4.5,
          w: 11.3,
          h: 1.0,
          fontSize: 18,
          fontFace: theme.fontFace,
          color: theme.textColor,
          align: "center",
          valign: "top",
        });
      }
      break;

    case "interactive_qa":
      // Formative Q&A question and options
      slide.addText(`Question Check:`, {
        x: 0.8,
        y: 0.8,
        w: 11.7,
        h: 0.5,
        fontSize: 14,
        fontFace: theme.fontFace,
        color: theme.accentColor,
        bold: true,
        valign: "bottom",
      });

      slide.addText(title, {
        x: 0.8,
        y: 1.4,
        w: 11.7,
        h: 1.2,
        fontSize: 24,
        fontFace: theme.fontFace,
        color: theme.textColor,
        bold: true,
        valign: "top",
      });

      if (bullets && bullets.length > 0) {
        const optionObjects = bullets.slice(0, 5).map((opt) => ({
          text: opt,
          options: {
            bullet: { type: "number" },
            fontSize: 15,
            fontFace: theme.fontFace,
            color: theme.textColor,
            lineSpacing: 22,
          },
        }));

        slide.addText(optionObjects, {
          x: 0.8,
          y: 2.8,
          w: 11.7,
          h: 3.8,
          valign: "top",
        });
      }
      break;

    default:
      // Simple fallback
      slide.addText(title, {
        x: 1.0,
        y: 1.0,
        w: 11.3,
        h: 5.0,
        fontSize: 20,
        fontFace: theme.fontFace,
        color: theme.textColor,
        valign: "middle",
      });
  }
}
