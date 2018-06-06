
###########################################################################
##                      Example indentation for R.js 
##                         Pierre de Villemereuil
###########################################################################

# Indentwith is 4 by default here

# Simple indenting when opening (, [ or {
namefunc <- function(arg1, arg2) {
    tryCatch(
        print("Hello")
    )
    
    out <- c(
        x1  = 1,
        x2  = 2,
        x3  = 3
    )
}
# The script also indent back when a bracket is entered

# Brackets matching for arguments
paste0("This is a long string",
       "pasted to yet another",
       "quite long string")
matrix[row == test,
       col == othertest]

# Indent for assignment and formulas
tmp <-
    this(is(a, very, big, instruction, that, takes, soooooooome, spaaaaaace))
# Align in case of operators
tmp ~ this +
      that -
      yetanotherthing
# Should not indent after these kind of assignments
tmp <- NA
tmp <- "Test"
tmp

# Accounting for equal sign and commas for indenting
# Indent is following "=" unless a corresponding comma/parenthesis is met
plot(x = vec1[select == test] +
         vec2[select == test],
     y = vec3 %*%     
         matrix(c(1, 0, 0, 1),
                nrow = 3))

# Note that this might create issues if you use "=" for assignment,
# this script is conceived with "<-" for assignment

# Operators indent only the first time
ggplot(data = data) +
    geom_line(aes(x = something, y = otherstuff)) +
    coord_flip()

# Operators indent at the formula sign "~" when relevant
lm(Response ~ Var1 +
              Var2 +
              Var3,
   data = data)

# Works well with the tidyverse workflow
data <-
    data %>%
    mutate(var4 = case_when(var1 == 1 ~ 1,
                            var1 == 2 ~ 2,
                            TRUE      ~ NA) %>%
                  sqrt(),
           var5 = var2 +
                  var3 +
                  var4,
           var6 = var2 %>%
                  recode(`1` = "a",
                         `2` = "b",
                         `3` = "c") %>%
                  as_factor(),
           var7 = map(var1, 
                      ~ complicated_function(arg1 = .,
                                             arg2 = toto +
                                                    tutu,
                                             arg3 = "string")) %>%
                  anotherfunction()) %>%
    rename(NiceName1 = var1,
           NiceName2 = var2) %>%
    #group_by(group) %>%
    {bind_cols(
        summarise_at(.,
                     vars(contains("sel")),
                     mean),
        summarise_at(.,
                     vars(contains("sel")),
                     var)
    )}
