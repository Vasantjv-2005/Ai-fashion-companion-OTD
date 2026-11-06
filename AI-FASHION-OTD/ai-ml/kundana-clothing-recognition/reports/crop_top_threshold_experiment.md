# Crop-Top Prompt Threshold Experiment

## 1. Objective
Improve FashionCLIP clothing-category classification, especially the difficult "top, t-shirt, sweatshirt" category.

## 2. Model and Dataset
- Model: patrickjohncyh/fashion-clip
- Evaluation dataset: Fashionpedia
- Validation samples: 7,721
- Final test samples: 7,678
- Device: CPU
- Categories: 13

## 3. Methods Compared

### Baseline
Used the original 13 category prompts:
"a photo of {category}"

### Threshold 0
Added one extra prompt:
"a photo of a crop top"

For each image:
1. Calculate FashionCLIP scores for all 13 original category prompts.
2. Calculate the score for the crop-top prompt.
3. Compare the crop-top score with the original Top/T-shirt/Sweatshirt score.
4. Replace the original top-category score with the crop-top score only when:

   crop_top_score - original_top_score > 0

5. Select the category with the highest final score.

Note: These are raw similarity scores, not calibrated probabilities.

## 4. Validation Results

| Method | Overall Accuracy |
|---|---:|
| Baseline | 58.08% |
| Always crop-top | 60.58% |
| Threshold 0 | 62.70% |

Threshold 0 was selected for final evaluation using validation results.

## 5. Final Test Results

| Method | Overall Accuracy |
|---|---:|
| Baseline | 57.44% |
| Threshold 0 | 62.18% |
| Improvement | +4.74 percentage points |

Total test samples: 7,678.

All 7,678 samples were processed.

## 6. Category-wise Test Results

| Category | Baseline | Threshold 0 |
|---|---:|---:|
| Shirt, blouse | 37.91% | 35.16% |
| Top, t-shirt, sweatshirt | 26.48% | 52.72% |
| Sweater | 83.33% | 81.94% |
| Cardigan | 55.45% | 53.64% |
| Jacket | 56.37% | 55.72% |
| Vest | 57.89% | 54.39% |
| Pants | 84.12% | 84.04% |
| Shorts | 85.56% | 82.96% |
| Skirt | 57.95% | 56.59% |
| Coat | 51.81% | 51.81% |
| Dress | 70.97% | 69.24% |
| Jumpsuit | 18.18% | 18.18% |
| Cape | 0.00% | 0.00% |

## 7. Observations

- Overall test accuracy improved by 4.74 percentage points.
- Top/T-shirt/Sweatshirt improved by 26.24 percentage points.
- Most other categories experienced small accuracy reductions.
- Vest, shorts, and shirt/blouse remain areas for improvement.
- The threshold method improves overall performance but does not improve every category.

## 8. Limitations

- Fashionpedia labels may contain overlapping or noisy category annotations.
- The top category combines several different garment types.
- FashionCLIP similarity scores are not calibrated confidence values.
- This experiment does not involve model fine-tuning.
- The results measure performance on Fashionpedia crops, not necessarily real-world wardrobe images.

## 9. Final Decision

Keep the threshold method as an experimental improvement candidate.

Final test-set results have been recorded. Do not use the test set for further prompt or threshold tuning. Use validation data for future experiments and reserve the test set for final reporting.

## 10. Output File

dataset/fashionpedia/processed/final_crop_top_test_results.csv

Status: Experiment completed.
