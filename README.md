# Condition Markers

Quickly add condition markers to your characters to keep track of concentration, grapples, invisibility, etc.

Credit for the marker designs goes to /u/JinxShadow on Reddit!

![Interface](https://raw.githubusercontent.com/kgbergman/conditionmarkers/main/docs/header.jpg)

## Installing

The extension can be installed from the Owlbear Rodeo [extensions page](https://extensions.owlbear.rodeo/condition-markers).

## How it Works

### Building images

Install ImageMagick 7 and ensure `magick` is available on `PATH`.
`npm run build` first generates the WebP assets from the originals in
`images_src`, then compiles the application. Run `npm run images` to regenerate
the images separately, including before local development after changing an original.

`public/images` (scene markers) is generated at 128 × 128 pixels and `src/images`
(bundled icons) at 150 × 150 pixels, using Lanczos resampling and lossless WebP encoding.
Always add or edit originals in `images_src`; generated files are overwritten
at each build. The originals are never modified. If the scene output size changes,
also update `imageDimensions` in `src/helpers.ts`.

On Render, the automatic `RENDER=true` environment variable makes the script use
the committed generated images without invoking ImageMagick. After editing or
adding originals, run `npm run images` locally and commit `images_src`,
`public/images` and `src/images` together. The Render build checks that every
original has a non-empty generated file in both output directories and reports
missing assets instead of deploying broken markers.

This project is a simple Typescript app and works similarly to the [Colored Rings](https://extensions.owlbear.rodeo/colored-rings) extension by Owlbear Rodeo, which was the basis for this project.

The background script background.ts communicates with Owlbear Rodeo to create a context menu item, and when that item is clicked a popup is shown with the main.ts site rendered.

The main.ts site displays an interface of 16 icons at a time. These 16 icons can be clicked, which will display a transparent white overlay to indicate they are currently selected. Hovering over them will display their name. 

![Icon Name](https://raw.githubusercontent.com/kgbergman/conditionmarkers/main/docs/iconname.jpg)


There are 4 pages of icons, which you can cycle through by clicking the left and right arrows on either side of the icons.

![Page Left](https://raw.githubusercontent.com/kgbergman/conditionmarkers/main/docs/pageleft.jpg)


You can also filter the icons by typing their name in the filter box. Clearing this box will bring you back to the page you were on.

![Filter](https://raw.githubusercontent.com/kgbergman/conditionmarkers/main/docs/filter.jpg)


As you select multiple icons, they will display in a grid-like fashion over the selected character starting at the top left, with a minimum of 5 on a side.

![Icons](https://raw.githubusercontent.com/kgbergman/conditionmarkers/main/docs/icongrid.jpg)


If for any reason you need to move or edit the icon, you can double-click on it and unlock it like any other item in Owlbear Rodeo.

![Move](https://raw.githubusercontent.com/kgbergman/conditionmarkers/main/docs/move.jpg)


## Known Issues

There is a problem with the rotation translation algorithm. I am unsure if this is due to entering an improper parameter (centerX, centerY), or if this is an issue on OBR's behalf.
The rotation works perfectly for intervals of 90 degrees, but icons are slightly spread out at any point between those intervals.

## License

Licensed under the Apache License, Version 2.0

## Contributing

I'm open to pull requests for bug fixes only. Pull requests for new features will not be accepted in order to keep the UI clean and simple.

## Support

If you want to support me financially, you can [buy me a coffee](https://www.buymeacoffee.com/keegandev)!

[Edit] Hi, Seamus here, I've taken over maintenance of this extension. If you have any problems please make a post in the [Owlbear Rodeo Discord extension-support forum](https://discord.gg/u5RYMkV98s)

Copyright (C) 2023 Keegan Bergman
