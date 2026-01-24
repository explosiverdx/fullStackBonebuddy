import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * GET /api/v1/pincode/:pincode
 * Proxies India Post pincode API to avoid CORS when calling from frontend (localhost).
 * Returns only { state, city } as requested; does not fetch or return full address.
 */
const getStateCityFromPincode = asyncHandler(async (req, res) => {
  const { pincode } = req.params;
  const digits = (pincode || "").replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) {
    throw new ApiError(400, "Pincode must be 6 digits.");
  }

  const response = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
  if (!response.ok) {
    throw new ApiError(502, "Pincode service unavailable.");
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0 || data[0].Status !== "Success") {
    return res.status(200).json(new ApiResponse(200, { state: null, city: null }, "No data for this pincode."));
  }

  const postOffices = data[0].PostOffice;
  if (!postOffices || postOffices.length === 0) {
    return res.status(200).json(new ApiResponse(200, { state: null, city: null }, "No data for this pincode."));
  }

  const office = postOffices[0];
  const state = (office.State || "").trim();
  const district = (office.District || "").trim();
  const city = (office.City || "").trim();

  let finalCity = city || district;
  if (!finalCity && postOffices.length > 1) {
    for (const po of postOffices) {
      const c = (po.City || "").trim();
      const d = (po.District || "").trim();
      if (c) {
        finalCity = c;
        break;
      }
      if (d) {
        finalCity = d;
        break;
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { state: state || null, city: finalCity || null },
      "State and city fetched."
    )
  );
});

export { getStateCityFromPincode };
