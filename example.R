
###########################################################################
##                      Example indentation for R.js 
##                         Pierre de Villemereuil
###########################################################################

# Indentwith is 4 by default

# Simple indenting when opening (, [ or {
namefunc <- function(arg1, arg2) {
    tryCatch(
        print("Hello")
        ) # Unfortunately, the indenting script cannot reset the indent here... 
}

# Brackets matching for arguments
paste0("This is a long string",
       "pasted to yet another",
       "quite long string")
matrix[row == test,
       col == othertest]

# Accounting for equal sign and commas for indenting
# Indent is following "=" unless a corresponding comma/parenthesis is met
plot(x = vec1[select == test] +
         vec2[select == test],
     y = vec3 %*%
         matrix(c(1, 0, 0, 1),
                nrow = 3))
# Note that this might create issues if you use "=" for assignment,
# this script is conceived with "<-" for assignment

# Some special characters trigger indenting only the first time
ggplot(data = data) +
    geom_line(aes(x = something, y = otherstuff)) +
    coord_flip()

# Works well with the tidyverse workflow
data <-
    data %>%
    mutate(var1 = transform(var1),
           var5 = var2 +
                  var3 +
                  var4,
           var6 = var4 %>%
                  map(~ complicated_function(arg1 = .,
                                             arg2 = toto +
                                                    tutu,
                                             arg3 = "string")) %>%
                  anotherfunction()) %>%
    still_there()


