/*
---

name: Jx.Row

description: Holds information related to display of rows in the grid.

license: MIT-style license.

requires:
 - Jx.Object

provides: [Jx.Row]

...
 */
// $Id$
/**
 * Class: Jx.Row
 *
 * Extends: <Jx.Object>
 *
 * A class defining a grid row.
 *
 * Inspired by code in the original Jx.Grid class
 *
 * License:
 * Original Copyright (c) 2008, DM Solutions Group Inc.
 * This version Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Row = new Class({

  Family: 'Jx.Row',
    Extends : Jx.Object,

    options : {
        /**
         * Option: useHeaders
         * defaults to false.  If set to true, then a column of row header
         * cells are displayed.
         */
        useHeaders : false,
        /**
         * Option: alternateRowColors
         * defaults to false.  If set to true, then alternating CSS classes
         * are used for rows.
         */
        alternateRowColors : false,
        /**
         * Option: rowClasses
         * object containing class names to apply to rows
         */
        rowClasses : {
            odd : 'jxGridRowOdd',
            even : 'jxGridRowEven',
            all : 'jxGridRowAll'
        },
        /**
         * Option: rowHeight
         * The height of the row. Make it null or 'auto' to auto-calculate.
         */
        rowHeight : 20,
        /**
         * Option: headerWidth
         * The width of the row header. Make it null or 'auto' to auto-calculate
         */
        headerWidth : 40,
        /**
         * Option: headerColumn
         * The name of the column in the model to use as the header
         */
        headerColumn : null
    },
    /**
     * Property: grid
     * A reference to the grid that this row model belongs to
     */
    grid : null,
    /**
     * Property: heights
     * This will hold the calculated height of each row in the grid.
     */
    heights: [],
    /**
     * Property: rules
     * A hash that will hold all of the CSS rules for the rows.
     */
    rules: $H(),

    parameters: ['options','grid'],

    /**
     * APIMethod: init
     * Creates the row model object.
     */
    init : function () {
        this.parent();

        if ($defined(this.options.grid) && this.options.grid instanceof Jx.Grid) {
            this.grid = this.options.grid;
        }
    },
    /**
     * APIMethod: getGridRowElement
     * Used to create the TR for the main grid row
     */
    getGridRowElement : function (row, text) {
        var o = this.options,
            rc = o.rowClasses,
            c = o.alternateRowColors ?(row % 2 ? rc.even : rc.odd) : rc.all,
            tr = new Element('tr', {
              'class' : 'jxGridRow'+row+' '+ c,
              html: text || ''
            });
        return tr;
    },
    /**
     * Method: getRowHeaderCell
     * creates the TH for the row's header
     */
    getRowHeaderCell : function (text) {
      text = text ? '<span class="jxGridCellContent">'+text + '</span>' : '';
      return new Element('th', {
        'class' : 'jxGridRowHead',
        html: text
      });
    },
    /**
     * APIMethod: getRowHeaderWidth
     * determines the row header's width.
     */
    getRowHeaderWidth : function () {
      var col, width;
      if (this.options.headerColumn) {
        col = this.grid.columns.getByName(this.options.headerColumn);
        if (!$defined(col.getWidth())) {
          col.calculateWidth(true);
        }
        width = col.getWidth();
      } else {
        width = this.options.headerWidth;
      }
      return width;
    },

    /**
     * APIMethod: getHeight
     * determines and returns the height of a row
     */
    getHeight : function (row) {
      var h = this.options.rowHeight,
          rowEl;
      //this should eventually compute a height, however, we would need
      //a fixed width to do so reliably. For right now, we use a fixed height
      //for all rows.
      if ($defined(this.heights[row])) {
        h = this.heights[row];
      } else if ($defined(this.options.rowHeight)) {
        if (this.options.rowHeight == 'auto') {
          // this.calculateHeight(row);
          h = 20; // TODO calculate?
          rowEl = this.grid.gridTableBody.rows[row]
          if (rowEl) {
            h = rowEl.getContentBoxSize().height; 
          }
        } else if (Jx.type(this.options.rowHeight) !== 'number') {
          h = 20; // TODO calculate?
        }
      }
      return h;
    },
    /**
     * Method: calculateHeights
     */
    calculateHeights : function () {
      if (this.options.rowHeight === 'auto' ||
          !$defined(this.options.rowHeight)) {
        //grab all rows in the grid body
        document.id(this.grid.gridTableBody).getChildren().each(function(row){
          row = document.id(row);
          var data = row.retrieve('jxRowData');
          var s = row.getContentBoxSize();
          this.heights[data.row] = s.height;
        },this);
        document.id(this.grid.rowTableHead).getChildren().each(function(row){
          row = document.id(row);
          var data = row.retrieve('jxRowData');
          if (data) {
            var s = row.getContentBoxSize();
            this.heights[data.row] = Math.max(this.heights[data.row],s.height);
            if (Browser.Engine.webkit) {
                //for some reason webkit (Safari and Chrome)
                this.heights[data.row] -= 1;
            }
          }
        },this);
      } else {
        document.id(this.grid.rowTableHead).getChildren().each(function(row,idx){
          this.heights[idx] = this.options.rowHeight;
        }, this);
      }
    },

    /**
     * APIMethod: useHeaders
     * determines and returns whether row headers should be used
     */
    useHeaders : function () {
        return this.options.useHeaders;
    },
    /**
     * APIMethod: getRowHeader
     * creates and returns the header for the current row
     *
     * Parameters:
     * list - Jx.List instance to add the header to
     */
    getRowHeader : function (list) {
        var th = this.getRowHeaderCell();
        //if (this.grid.model.getPosition() === 0) {
        //    var rowWidth = this.getRowHeaderWidth();
        //    th.setStyle("width", rowWidth);
        //}
        th.store('jxCellData', {
            rowHeader: true,
            row: this.grid.model.getPosition()
        });
        list.add(th);
    },
    /**
     * APIMethod: getRowHeaderColumn
     * returns the name of the column that is used for the row header
     */
    getRowHeaderColumn : function () {
        return this.options.headerColumn;
    }
});
