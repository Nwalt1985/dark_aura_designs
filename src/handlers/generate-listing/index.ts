import { getGeneratedFileNames } from '../../helpers';
import { PromptResponseType } from '../../models/schemas/prompt';
import { deleteListingByFileName, getDBListings } from '../../service/db';
import { createPrintifyListings } from '../../service/printify';

(async () => {
  const listings = await getDBListings();

  console.log('Tidying up the database');
  const data = await dbTidy(listings);

  console.log(`Creating ${data.length} Printify listings`);
  await createPrintifyListings(data);

  return;
})();

// Remove listings from the database that do not have a corresponding image file
async function dbTidy(list: PromptResponseType) {
  const listings = list.map((listing) =>
    listing.filename.replace('-mockup-2543x1254', ''),
  );
  const fileNameArray = getGeneratedFileNames();

  for (const listing of listings) {
    if (!fileNameArray.includes(listing)) {
      console.log(`Deleting ${listing} from the DB`);
      await deleteListingByFileName(listing);
    }
  }

  return await getDBListings();
}
