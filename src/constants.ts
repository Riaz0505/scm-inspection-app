import { DefectCategory } from './types';

export const DEFECT_CATEGORIES: DefectCategory[] = [
  {
    name: "Fabric Issues",
    icon: "Layers",
    subCategories: [
      { name: "Pilling", description: "Small balls forming on fabric", imageUrl: "" },
      { name: "Color Fading", description: "Color fading after wash", imageUrl: "" },
      { name: "Shrinkage", description: "Size becomes smaller", imageUrl: "" },
      { name: "Uneven Dyeing", description: "Shade variation", imageUrl: "" },
      { name: "Fabric Thinning", description: "Low GSM", imageUrl: "" },
      { name: "Holes", description: "Weak yarn or holes", imageUrl: "" },
      { name: "Fabric Twisting", description: "Twisting after wash", imageUrl: "" }
    ]
  },
  {
    name: "Stitching Issues",
    icon: "Scissors",
    subCategories: [
      { name: "Loose Threads", description: "Excessive loose threads", imageUrl: "" },
      { name: "Broken Stitches", description: "Stitches snapped", imageUrl: "" },
      { name: "Uneven Stitching", description: "Wavy or irregular lines", imageUrl: "" },
      { name: "Seam Puckering", description: "Wrinkled seams", imageUrl: "" },
      { name: "Skipped Stitches", description: "Missing stitches in line", imageUrl: "" },
      { name: "Open Seams", description: "Seams not closed properly", imageUrl: "" }
    ]
  },
  {
    name: "Fit & Measurement",
    icon: "Ruler",
    subCategories: [
      { name: "Size Mismatch", description: "Label vs actual size", imageUrl: "" },
      { name: "Uneven Sleeves", description: "Sleeves different lengths", imageUrl: "" },
      { name: "Neck Stretching", description: "Collar loose or stretched", imageUrl: "" },
      { name: "Length Inconsistency", description: "Length varies from spec", imageUrl: "" }
    ]
  },
  {
    name: "Printing Issues",
    icon: "Palette",
    subCategories: [
      { name: "Print Cracking", description: "Print splitting apart", imageUrl: "" },
      { name: "Print Peeling", description: "Print coming off", imageUrl: "" },
      { name: "Misaligned Print", description: "Print not centered", imageUrl: "" },
      { name: "Ink Bleeding", description: "Ink spreading on fabric", imageUrl: "" }
    ]
  },
  {
    name: "Label & Branding",
    icon: "Tag",
    subCategories: [
      { name: "Wrong Size Label", description: "Incorrect size tag", imageUrl: "" },
      { name: "Misplaced Label", description: "Label in wrong position", imageUrl: "" },
      { name: "Itchy Neck Label", description: "Label material causing irritation", imageUrl: "" }
    ]
  },
  {
    name: "Washing & Finishing",
    icon: "Waves",
    subCategories: [
      { name: "Color Bleeding", description: "Color running during wash", imageUrl: "" },
      { name: "Chemical Stains", description: "Stains from processing", imageUrl: "" },
      { name: "Improper Ironing", description: "Burn marks or poor press", imageUrl: "" },
      { name: "Wrinkles", description: "Poor finishing quality", imageUrl: "" }
    ]
  }
];
